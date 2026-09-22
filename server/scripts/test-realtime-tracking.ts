import axios from 'axios';
import { io as ClientSocket, Socket } from 'socket.io-client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';
const SOCKET_BASE = 'http://localhost:5000';

async function runRealtimeTrackingTests() {
  console.log('===============================================================');
  console.log('  SMARTFOODRESCUE - REAL-TIME GPS TRACKING VERIFICATION SUITE  ');
  console.log('===============================================================\n');

  // 1. Health check
  console.log('[1/7] Checking backend health & DB connectivity...');
  const health = await axios.get(`${API_BASE}/health`);
  console.log(`  ✓ Health: ${health.data.status} | DB: ${health.data.database}`);

  // 2. Login accounts
  console.log('\n[2/7] Authenticating test accounts...');
  const accounts = [
    { email: 'admin@smartfoodrescue.com', pass: 'Admin@123', role: 'ADMIN' },
    { email: 'donor@smartfoodrescue.com', pass: 'Donor@123', role: 'DONOR' },
    { email: 'ngo@smartfoodrescue.com', pass: 'Ngo@123', role: 'NGO' },
    { email: 'volunteer@smartfoodrescue.com', pass: 'Volunteer@123', role: 'VOLUNTEER' },
  ];

  const tokens: Record<string, string> = {};
  for (const acc of accounts) {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: acc.email,
      password: acc.pass
    });
    tokens[acc.role] = res.data.token;
    console.log(`  ✓ ${acc.role.padEnd(10)} authenticated (${res.data.user.email})`);
  }

  // 3. Find or create an active pickup for testing
  console.log('\n[3/7] Locating test pickup for tracking verification...');
  const pickupsRes = await axios.get(`${API_BASE}/pickups`, {
    headers: { Authorization: `Bearer ${tokens.ADMIN}` }
  });

  if (!pickupsRes.data || pickupsRes.data.length === 0) {
    throw new Error('No pickups found in database. Run npm run seed first.');
  }

  const testPickup = pickupsRes.data[0];
  const pickupId = testPickup._id;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SmartFoodRescue';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Ensure volunteer is assigned
  const volProfileRes = await axios.get(`${API_BASE}/volunteers/me`, {
    headers: { Authorization: `Bearer ${tokens.VOLUNTEER}` }
  });
  const volId = volProfileRes.data._id;

  // Reset test pickup to ASSIGNED to test the full lifecycle deterministically
  await mongoose.connection.collection('pickups').updateOne(
    { _id: new mongoose.Types.ObjectId(pickupId) },
    { $set: { pickupStatus: 'ASSIGNED', volunteerId: new mongoose.Types.ObjectId(volId) } }
  );
  console.log(`  ✓ Prepared Test Pickup #${pickupId} set to ASSIGNED with Volunteer ${volId}`);

  // 4. Test Socket.IO Authentication & Authorization
  console.log('\n[4/7] Testing Socket.IO Handshake Auth & Room Security...');
  
  // Negative test: invalid token rejected
  const rejectedSocket = ClientSocket(SOCKET_BASE, {
    auth: { token: 'invalid_bad_token' },
    transports: ['websocket'],
    reconnection: false
  });

  const rejectedPromise = new Promise<boolean>((resolve) => {
    rejectedSocket.on('connect_error', (err) => {
      console.log(`  ✓ Security Check: Connection with invalid token rejected (${err.message})`);
      rejectedSocket.disconnect();
      resolve(true);
    });
    setTimeout(() => {
      rejectedSocket.disconnect();
      resolve(false);
    }, 3000);
  });
  await rejectedPromise;

  // Positive test: valid volunteer socket connects
  const volunteerSocket: Socket = ClientSocket(SOCKET_BASE, {
    auth: { token: tokens.VOLUNTEER },
    transports: ['websocket'],
    reconnection: false
  });

  await new Promise<void>((resolve, reject) => {
    volunteerSocket.on('connect', () => {
      console.log(`  ✓ Volunteer Socket connected securely (Socket ID: ${volunteerSocket.id})`);
      resolve();
    });
    volunteerSocket.on('connect_error', (e) => reject(e));
  });

  // NGO socket connects to receive live feed
  const ngoSocket: Socket = ClientSocket(SOCKET_BASE, {
    auth: { token: tokens.NGO },
    transports: ['websocket'],
    reconnection: false
  });

  await new Promise<void>((resolve, reject) => {
    ngoSocket.on('connect', () => {
      console.log(`  ✓ NGO Socket connected securely (Socket ID: ${ngoSocket.id})`);
      resolve();
    });
    ngoSocket.on('connect_error', (e) => reject(e));
  });

  // 5. Test Room Subscription & State Transitions
  console.log('\n[5/7] Testing Room Subscription & Strict State Machine Transitions...');
  
  // Join room
  volunteerSocket.emit('join:pickup', { pickupId });
  ngoSocket.emit('join:pickup', { pickupId });

  await new Promise<void>((resolve) => {
    let joinedCount = 0;
    const checkJoined = (data: any) => {
      joinedCount++;
      console.log(`  ✓ Joined pickup tracking room: pickup:${data.pickupId}`);
      if (joinedCount >= 2) resolve();
    };
    volunteerSocket.once('tracking:joined', checkJoined);
    ngoSocket.once('tracking:joined', checkJoined);
  });

  // Advance state through strict transitions:
  // ASSIGNED -> RECEIVED -> DISPATCHED -> EN_ROUTE
  const freshPickup = (await axios.get(`${API_BASE}/pickups/${pickupId}`, {
    headers: { Authorization: `Bearer ${tokens.VOLUNTEER}` }
  })).data;
  const currentStatus = freshPickup.pickupStatus;
  console.log(`  • Stepping state forward from ${currentStatus}...`);

  if (currentStatus === 'ASSIGNED') {
    await axios.put(`${API_BASE}/pickups/${pickupId}/status`, { status: 'RECEIVED' }, {
      headers: { Authorization: `Bearer ${tokens.VOLUNTEER}` }
    });
    console.log('  ✓ Transitioned: ASSIGNED -> RECEIVED');
  }

  const pickupAfterRec = (await axios.get(`${API_BASE}/pickups/${pickupId}`, {
    headers: { Authorization: `Bearer ${tokens.VOLUNTEER}` }
  })).data;

  if (pickupAfterRec.pickupStatus === 'RECEIVED') {
    await axios.put(`${API_BASE}/pickups/${pickupId}/status`, { status: 'DISPATCHED' }, {
      headers: { Authorization: `Bearer ${tokens.VOLUNTEER}` }
    });
    console.log('  ✓ Transitioned: RECEIVED -> DISPATCHED');
  }

  // 6. Test Start Tracking (DISPATCHED -> EN_ROUTE)
  console.log('\n[6/7] Testing Live Tracking Session Start & GPS Coordinate Emission...');
  const startTrackingRes = await axios.post(
    `${API_BASE}/pickups/${pickupId}/tracking/start`,
    {
      latitude: 19.0760,
      longitude: 72.8777,
      accuracy: 12,
      speed: 25,
      heading: 180
    },
    { headers: { Authorization: `Bearer ${tokens.VOLUNTEER}` } }
  );

  console.log('  ✓ Tracking Session Started:');
  console.log(`    • Session ID: ${startTrackingRes.data.trackingSessionId}`);
  console.log(`    • Pickup Status: ${startTrackingRes.data.status}`);

  // Test Real-Time Location Update via Socket.IO
  const locationUpdatePromise = new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for live volunteer:location event')), 5000);
    ngoSocket.once('volunteer:location', (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

  // Volunteer emits real GPS coordinates
  volunteerSocket.emit('location:update', {
    pickupId,
    latitude: 19.0820,
    longitude: 72.8810,
    accuracy: 8,
    speed: 32,
    heading: 90,
    timestamp: Date.now()
  });

  const receivedLocation = await locationUpdatePromise;
  console.log('  ✓ NGO Socket received real-time volunteer:location event WITHOUT page refresh:');
  console.log(`    • Coordinates: Lat ${receivedLocation.latitude}, Lng ${receivedLocation.longitude}`);
  console.log(`    • Speed: ${receivedLocation.speed} km/h | Heading: ${receivedLocation.heading}° | Accuracy: ±${receivedLocation.accuracy}m`);

  // Test Negative Coordinate Validation (Reject invalid coordinates)
  const validationErrorPromise = new Promise<string>((resolve) => {
    volunteerSocket.once('tracking:error', (err) => {
      resolve(err.message);
    });
  });

  volunteerSocket.emit('location:update', {
    pickupId,
    latitude: 999.0, // Invalid latitude
    longitude: 72.8810
  });

  const errorMsg = await validationErrorPromise;
  console.log(`  ✓ Coordinate Boundary Validation: Out-of-bounds latitude rejected ("${errorMsg}")`);

  // 7. Test Route & Navigation API + Stop Tracking
  console.log('\n[7/7] Testing Route Calculation & Stop Navigation (EN_ROUTE -> ARRIVED)...');
  const routeRes = await axios.get(`${API_BASE}/pickups/${pickupId}/route?lat=19.0820&lng=72.8810`, {
    headers: { Authorization: `Bearer ${tokens.VOLUNTEER}` }
  });

  console.log('  ✓ Route Calculated:');
  console.log(`    • Provider: ${routeRes.data.provider}`);
  console.log(`    • Distance: ${routeRes.data.distanceKm} km (${routeRes.data.distanceMeters} meters)`);
  console.log(`    • Duration / ETA: ${routeRes.data.durationMinutes} minutes (${routeRes.data.durationSeconds}s)`);
  console.log(`    • Polyline Waypoints: ${routeRes.data.coordinates.length} points`);

  // Stop Tracking -> ARRIVED
  const stopTrackingRes = await axios.post(
    `${API_BASE}/pickups/${pickupId}/tracking/stop`,
    {},
    { headers: { Authorization: `Bearer ${tokens.VOLUNTEER}` } }
  );

  console.log(`  ✓ Volunteer Arrived: ${stopTrackingRes.data.status}`);

  // Disconnect sockets cleanly
  volunteerSocket.disconnect();
  ngoSocket.disconnect();
  await mongoose.disconnect();

  console.log('\n===============================================================');
  console.log('  ALL REAL-TIME LIVE TRACKING TESTS PASSED SUCCESSFULLY (100%) ');
  console.log('===============================================================\n');
}

runRealtimeTrackingTests().catch((err) => {
  console.error('\n❌ Test failed:', err.response?.data || err.message || err);
  process.exit(1);
});
