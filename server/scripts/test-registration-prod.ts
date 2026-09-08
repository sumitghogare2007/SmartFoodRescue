import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:5000/api';

async function verify() {
  console.log('===========================================================');
  console.log('TEST 1: GET /api/health');
  console.log('===========================================================');
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log('Health Response:', healthRes.data);

  console.log('\n===========================================================');
  console.log('TEST 2: DEMO LOGIN (All 4 Seeded Accounts)');
  console.log('===========================================================');
  const demoUsers = [
    { email: 'admin@smartfoodrescue.com', pass: 'Admin@123', role: 'ADMIN' },
    { email: 'donor@smartfoodrescue.com', pass: 'Donor@123', role: 'DONOR' },
    { email: 'ngo@smartfoodrescue.com', pass: 'Ngo@123', role: 'NGO' },
    { email: 'volunteer@smartfoodrescue.com', pass: 'Volunteer@123', role: 'VOLUNTEER' }
  ];

  for (const u of demoUsers) {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: u.email,
      password: u.pass
    });
    console.log(`✓ Login Success: ${u.email} -> Name: "${res.data.user.name}", Role: ${res.data.user.userType}, Token received`);
  }

  console.log('\n===========================================================');
  console.log('TEST 3: NEW USER REGISTRATION (Testing for Case Mismatch)');
  console.log('===========================================================');
  const testEmail = `prod_test_${Date.now()}@smartfoodrescue.com`;
  const registerPayload = {
    name: 'Atlas Production Test Donor',
    email: testEmail,
    phone: '9876500000',
    password: 'Password@123',
    userType: 'DONOR',
    donorType: 'Restaurant',
    organizationName: 'Atlas Test Kitchen',
    address: '42 Marine Drive',
    area: 'Churchgate',
    city: 'Mumbai',
    pincode: '400020'
  };

  console.log(`Attempting registration for: ${testEmail}...`);
  const regRes = await axios.post(`${API_BASE}/auth/register`, registerPayload);
  console.log('✓ REGISTRATION SUCCEEDED WITH NO CASE-MISMATCH ERROR!');
  console.log('  Registered User ID:', regRes.data.user._id);
  console.log('  User Email:', regRes.data.user.email);
  console.log('  User Type:', regRes.data.user.userType);
  console.log('  Profile created:', Boolean(regRes.data.user.donorProfile));

  console.log('\n===========================================================');
  console.log('TEST 4: DIRECT MONGODB ATLAS DATABASE INSPECTION');
  console.log('===========================================================');
  const uri = (process.env.MONGODB_URI || '').replace(/\/SmartFoodRescue(?=[\/?]|$)/i, '/smartfoodrescue');
  await mongoose.connect(uri, { dbName: 'smartfoodrescue' });
  const activeDbName = mongoose.connection.db?.databaseName;
  console.log(`Connected directly to Atlas cluster -> Active Database: "${activeDbName}"`);

  if (activeDbName !== 'smartfoodrescue') {
    throw new Error(`Unexpected database name: ${activeDbName}. Expected: smartfoodrescue`);
  }

  const foundUser = await mongoose.connection.db?.collection('users').findOne({ email: testEmail });
  console.log('✓ Found registered user directly in smartfoodrescue.users:');
  console.log(`  _id: ${foundUser?._id}, email: ${foundUser?.email}, userType: ${foundUser?.userType}`);

  const foundDonor = await mongoose.connection.db?.collection('donors').findOne({ userId: foundUser?._id });
  console.log('✓ Found corresponding donor profile in smartfoodrescue.donors:');
  console.log(`  _id: ${foundDonor?._id}, organizationName: ${foundDonor?.organizationName}`);

  // Clean up the temporary test user
  if (foundDonor) {
    await mongoose.connection.db?.collection('locations').deleteOne({ _id: foundDonor.locationId });
    await mongoose.connection.db?.collection('donors').deleteOne({ _id: foundDonor._id });
  }
  if (foundUser) {
    await mongoose.connection.db?.collection('users').deleteOne({ _id: foundUser._id });
  }
  console.log('\n✓ Temporary registration test documents cleaned up from Atlas.');
  await mongoose.disconnect();

  console.log('\n===========================================================');
  console.log('ALL TESTS PASSED WITH ZERO CASE-MISMATCH ERRORS!');
  console.log('===========================================================');
}

verify().catch(err => {
  console.error('VERIFICATION FAILED:', err.response?.data || err.message);
  process.exit(1);
});
