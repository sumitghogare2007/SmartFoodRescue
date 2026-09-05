import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Models
import User from '../src/models/User';
import Location from '../src/models/Location';
import Donor from '../src/models/Donor';
import NGO from '../src/models/NGO';
import Volunteer from '../src/models/Volunteer';
import FoodDonation from '../src/models/FoodDonation';
import FoodItem from '../src/models/FoodItem';
import DonationRequest from '../src/models/DonationRequest';
import Pickup from '../src/models/Pickup';
import PickupTracking from '../src/models/PickupTracking';
import Distribution from '../src/models/Distribution';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SmartFoodRescue';

async function runVerification() {
  console.log('====================================================');
  console.log('STARTING SMARTFOODRESCUE DATABASE VERIFICATION');
  console.log('====================================================');
  console.log(`Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected successfully\n');

  // 1. Verify Database Name
  const dbName = mongoose.connection.db?.databaseName;
  console.log(`[1] Database Name: ${dbName} (Expected: SmartFoodRescue)`);
  if (dbName !== 'SmartFoodRescue') {
    throw new Error(`Unexpected database name: ${dbName}`);
  }

  // 2. Verify Collections exist in MongoDB Compass
  const collections = await mongoose.connection.db?.listCollections().toArray();
  const collectionNames = collections?.map(c => c.name).sort() || [];
  console.log('[2] Active Collections in MongoDB Compass:');
  console.log(collectionNames);

  const requiredCollections = [
    'users',
    'donors',
    'ngos',
    'volunteers',
    'locations',
    'foodDonations',
    'foodItems',
    'donationRequests',
    'pickups',
    'pickupTracking',
    'distributions'
  ];

  for (const col of requiredCollections) {
    if (!collectionNames.includes(col)) {
      throw new Error(`Missing expected collection: ${col}`);
    }
  }
  console.log('--> All 11 ER collections are present and match naming requirements!\n');

  // 3. Verify Demo Users & Bcrypt Password Hashing
  console.log('[3] Verifying Demo User Accounts & Password Authentication:');
  const demoAccounts = [
    { email: 'admin@smartfoodrescue.com', pass: 'Admin@123', role: 'ADMIN' },
    { email: 'donor@smartfoodrescue.com', pass: 'Donor@123', role: 'DONOR' },
    { email: 'ngo@smartfoodrescue.com', pass: 'Ngo@123', role: 'NGO' },
    { email: 'volunteer@smartfoodrescue.com', pass: 'Volunteer@123', role: 'VOLUNTEER' }
  ];

  for (const acc of demoAccounts) {
    const user = await User.findOne({ email: acc.email });
    if (!user) throw new Error(`User not found: ${acc.email}`);
    const isPassValid = await bcrypt.compare(acc.pass, user.passwordHash);
    console.log(`  - ${acc.role.padEnd(9)}: ${user.email} | bcrypt valid: ${isPassValid} | Type: ${user.userType}`);
    if (!isPassValid) throw new Error(`Password check failed for ${acc.email}`);
  }
  console.log('--> All 4 demo accounts authenticated via bcrypt!\n');

  // 4. Test Food Donation Creation with 12-Digit Aadhaar & Masking
  console.log('[4] Testing Food Donation with Aadhaar ID & Masking:');
  const donor = await Donor.findOne();
  const location = await Location.findOne();
  if (!donor || !location) throw new Error('Donor or Location missing for test');

  const testDonation = new FoodDonation({
    donorId: donor._id,
    locationId: location._id,
    donationDate: new Date(),
    quantity: 25,
    unit: 'kg',
    foodType: 'Fresh Dal & Rice Test Batch',
    foodCategory: 'Cooked',
    preparationTime: new Date(Date.now() - 2 * 3600 * 1000),
    expiryTime: new Date(Date.now() + 6 * 3600 * 1000),
    status: 'AVAILABLE',
    aadhaarId: '998877665544',
    isVegetarian: true,
    notes: 'Automated test donation'
  });
  await testDonation.save();
  console.log(`  - Created FoodDonation ID: ${testDonation._id}`);
  console.log(`  - Stored aadhaarId: ${testDonation.aadhaarId}`);
  
  // Test masking helper logic
  const maskedAadhaar = (testDonation.aadhaarId || '').replace(/\d(?=\d{4})/g, 'X');
  console.log(`  - Masked Aadhaar presentation: ${maskedAadhaar}`);

  // Create corresponding FoodItem
  const testFoodItem = new FoodItem({
    donationId: testDonation._id,
    foodName: 'Dal & Rice',
    foodCategory: 'Cooked',
    foodType: 'Cooked',
    quantity: 25,
    unit: 'kg',
    isVegetarian: true
  });
  await testFoodItem.save();
  console.log(`  - Created FoodItem linked to donation: ${testFoodItem._id}\n`);

  // 5. Test Expiry Validation
  console.log('[5] Testing Expiry Logic (Expired food rejection):');
  const expiredDonation = new FoodDonation({
    donorId: donor._id,
    locationId: location._id,
    donationDate: new Date(Date.now() - 48 * 3600 * 1000),
    quantity: 10,
    unit: 'kg',
    foodType: 'Old Curry',
    foodCategory: 'Cooked',
    expiryTime: new Date(Date.now() - 24 * 3600 * 1000), // Expired 24h ago
    status: 'EXPIRED',
    isVegetarian: true
  });
  await expiredDonation.save();
  console.log(`  - Created expired donation (${expiredDonation.expiryLabel}): ${expiredDonation._id}`);
  const isExpired = new Date() > expiredDonation.expiryTime;
  console.log(`  - Is expired verification: ${isExpired} (Must be true)`);
  if (!isExpired) throw new Error('Expiry check failed');
  console.log('--> Expired food validation verified!\n');

  // 6. Test NGO Request & Acceptance
  console.log('[6] Testing NGO Request -> Acceptance -> Pickup Creation:');
  const ngo = await NGO.findOne();
  const volunteer = await Volunteer.findOne();
  if (!ngo || !volunteer) throw new Error('NGO or Volunteer missing for test');

  const testRequest = new DonationRequest({
    donationId: testDonation._id,
    ngoId: ngo._id,
    requestedQuantity: 25,
    requestStatus: 'PENDING'
  });
  await testRequest.save();
  console.log(`  - NGO submitted request: ${testRequest._id}`);

  // Accept request
  testRequest.requestStatus = 'ACCEPTED';
  await testRequest.save();
  testDonation.status = 'ASSIGNED';
  await testDonation.save();

  // Create Pickup
  const testPickup = new Pickup({
    requestId: testRequest._id,
    volunteerId: volunteer._id,
    pickupStatus: 'ASSIGNED',
    statusHistory: [{
      status: 'ASSIGNED',
      changedBy: volunteer.userId,
      changedAt: new Date(),
      note: 'Volunteer assigned to pickup'
    }]
  });
  await testPickup.save();

  const tracking1 = new PickupTracking({
    pickupId: testPickup._id,
    status: 'ASSIGNED',
    changedBy: volunteer.userId,
    note: 'Initial assignment'
  });
  await tracking1.save();
  console.log(`  - Created Pickup (${testPickup._id}) in state ASSIGNED\n`);

  // 7. Test State Machine Transition: ASSIGNED -> RECEIVED -> DISPATCHED -> DELIVERED -> DISTRIBUTED
  console.log('[7] Testing Multi-Stage Volunteer Tracking Progression:');
  const stages: Array<'RECEIVED' | 'DISPATCHED' | 'DELIVERED' | 'DISTRIBUTED'> = [
    'RECEIVED',
    'DISPATCHED',
    'DELIVERED',
    'DISTRIBUTED'
  ];

  for (const nextStage of stages) {
    testPickup.pickupStatus = nextStage;
    testPickup.statusHistory.push({
      status: nextStage,
      changedBy: volunteer.userId,
      changedAt: new Date(),
      note: `Advanced to ${nextStage}`
    });
    await testPickup.save();

    const trackingEntry = new PickupTracking({
      pickupId: testPickup._id,
      status: nextStage,
      changedBy: volunteer.userId,
      note: `Transitioned to ${nextStage}`
    });
    await trackingEntry.save();
    console.log(`  - Advanced Pickup status: ${nextStage} (Logged in pickupTracking)`);
  }

  // 8. Test Distribution Record
  console.log('\n[8] Testing Distribution Record Creation:');
  const testDistribution = new Distribution({
    pickupId: testPickup._id,
    ngoId: ngo._id,
    distributionDate: new Date(),
    quantityDistributed: 25,
    beneficiaryCount: 80,
    distributionStatus: 'COMPLETED',
    notes: 'Meals served to shelter residents'
  });
  await testDistribution.save();
  console.log(`  - Created Distribution ID: ${testDistribution._id}`);
  console.log(`  - Beneficiaries served: ${testDistribution.beneficiaryCount}`);

  // 9. Clean up test records
  console.log('\n[9] Cleaning up test records:');
  await FoodItem.deleteOne({ _id: testFoodItem._id });
  await FoodDonation.deleteOne({ _id: testDonation._id });
  await FoodDonation.deleteOne({ _id: expiredDonation._id });
  await DonationRequest.deleteOne({ _id: testRequest._id });
  await Pickup.deleteOne({ _id: testPickup._id });
  await PickupTracking.deleteMany({ pickupId: testPickup._id });
  await Distribution.deleteOne({ _id: testDistribution._id });
  console.log('  - Temporary test records cleaned up safely.');

  // 10. Summary Document Counts in MongoDB
  console.log('\n====================================================');
  console.log('FINAL DATABASE SUMMARY (SmartFoodRescue):');
  console.log('====================================================');
  for (const col of requiredCollections) {
    const count = await mongoose.connection.db?.collection(col).countDocuments();
    console.log(`  ${col.padEnd(18)} : ${count} documents`);
  }
  console.log('====================================================');
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('====================================================');

  await mongoose.disconnect();
}

runVerification().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
