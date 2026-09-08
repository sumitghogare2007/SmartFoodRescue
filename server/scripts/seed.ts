import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
import dotenv from 'dotenv';
import path from 'path';

// Load .env from server/ directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import connectDB from '../src/config/db';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB successfully.');

    const hashPassword = async (pass: string) => bcrypt.hash(pass, await bcrypt.genSalt(10));

    // 1. DEMO USERS (4 Real Accounts)
    console.log('Upserting demo users...');
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@smartfoodrescue.com' },
      { 
        name: 'Platform Administrator', 
        email: 'admin@smartfoodrescue.com', 
        phone: '9876543210', 
        passwordHash: await hashPassword('Admin@123'), 
        userType: 'ADMIN' 
      },
      { upsert: true, new: true }
    );

    const donorUser = await User.findOneAndUpdate(
      { email: 'donor@smartfoodrescue.com' },
      { 
        name: 'Royal Feast Caterers', 
        email: 'donor@smartfoodrescue.com', 
        phone: '9822012345', 
        passwordHash: await hashPassword('Donor@123'), 
        userType: 'DONOR' 
      },
      { upsert: true, new: true }
    );

    const ngoUser = await User.findOneAndUpdate(
      { email: 'ngo@smartfoodrescue.com' },
      { 
        name: 'Asha Community Kitchen', 
        email: 'ngo@smartfoodrescue.com', 
        phone: '9833098765', 
        passwordHash: await hashPassword('Ngo@123'), 
        userType: 'NGO' 
      },
      { upsert: true, new: true }
    );

    const volunteerUser = await User.findOneAndUpdate(
      { email: 'volunteer@smartfoodrescue.com' },
      { 
        name: 'Vikram Joshi', 
        email: 'volunteer@smartfoodrescue.com', 
        phone: '9844055443', 
        passwordHash: await hashPassword('Volunteer@123'), 
        userType: 'VOLUNTEER' 
      },
      { upsert: true, new: true }
    );

    // 2. LOCATIONS
    console.log('Upserting locations...');
    const locDonor = await Location.findOneAndUpdate(
      { address: '102 Banquet Plaza, S.V. Road' },
      { 
        address: '102 Banquet Plaza, S.V. Road', 
        area: 'Andheri West', 
        city: 'Mumbai', 
        pincode: '400058',
        latitude: 19.1197,
        longitude: 72.8464
      },
      { upsert: true, new: true }
    );

    const locNGO = await Location.findOneAndUpdate(
      { address: '15 Care Shelter Road, Station Colony' },
      { 
        address: '15 Care Shelter Road, Station Colony', 
        area: 'Bandra East', 
        city: 'Mumbai', 
        pincode: '400051',
        latitude: 19.0596,
        longitude: 72.8495
      },
      { upsert: true, new: true }
    );

    const locSupermarket = await Location.findOneAndUpdate(
      { address: 'Shop 4, City Centre Market' },
      { 
        address: 'Shop 4, City Centre Market', 
        area: 'Dadar West', 
        city: 'Mumbai', 
        pincode: '400028',
        latitude: 19.0178,
        longitude: 72.8478
      },
      { upsert: true, new: true }
    );

    // 3. PROFILES (Donor, NGO, Volunteer)
    console.log('Upserting donor, NGO, and volunteer profiles...');
    const donor = await Donor.findOneAndUpdate(
      { userId: donorUser._id },
      { 
        userId: donorUser._id, 
        donorType: 'Restaurant', 
        organizationName: 'Royal Feast Caterers', 
        contactName: 'Rajesh Sharma', 
        contactPhone: '9822012345', 
        contactEmail: 'donor@smartfoodrescue.com', 
        locationId: locDonor._id, 
        isVerified: true 
      },
      { upsert: true, new: true }
    );

    const ngo = await NGO.findOneAndUpdate(
      { userId: ngoUser._id },
      { 
        userId: ngoUser._id, 
        ngoName: 'Asha Community Kitchen', 
        registrationNo: 'NGO-MH-2023-8821', 
        contactNo: '9833098765', 
        contactEmail: 'ngo@smartfoodrescue.com', 
        locationId: locNGO._id, 
        isVerified: true, 
        capacity: 400 
      },
      { upsert: true, new: true }
    );

    const volunteer = await Volunteer.findOneAndUpdate(
      { userId: volunteerUser._id },
      { 
        userId: volunteerUser._id, 
        availability: 'Available', 
        vehicleType: 'Van', 
        isVerified: true 
      },
      { upsert: true, new: true }
    );

    // 4. FOOD DONATIONS
    console.log('Upserting food donations...');
    const now = new Date();
    const expiryFresh = new Date(now.getTime() + 18 * 60 * 60 * 1000); // 18 hours from now
    const expiryDelivered = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const expiryUrgent = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now

    // Donation 1: Complete end-to-end distributed workflow
    const donation1 = await FoodDonation.findOneAndUpdate(
      { aadhaarId: '4532-8765-1092' },
      { 
        donorId: donor._id, 
        locationId: locDonor._id, 
        donationDate: new Date(now.getTime() - 5 * 60 * 60 * 1000), 
        quantity: 60, 
        unit: 'servings', 
        foodType: 'Nutritious Dal Khichdi and Mixed Vegetables', 
        foodCategory: 'Cooked', 
        preparationTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
        expiryTime: expiryDelivered, 
        status: 'DISTRIBUTED', 
        aadhaarId: '4532-8765-1092', 
        notes: 'Hot food prepared for an afternoon banquet. Properly packaged in thermal containers.',
        isVegetarian: true 
      },
      { upsert: true, new: true }
    );

    // Donation 2: Active in-progress workflow (ASSIGNED, ready for volunteer actions)
    const donation2 = await FoodDonation.findOneAndUpdate(
      { aadhaarId: '7721-3490-6543' },
      { 
        donorId: donor._id, 
        locationId: locDonor._id, 
        donationDate: new Date(now.getTime() - 1 * 60 * 60 * 1000), 
        quantity: 40, 
        unit: 'boxes', 
        foodType: 'Paneer Butter Masala & Roti Packets', 
        foodCategory: 'Cooked', 
        preparationTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        expiryTime: expiryUrgent, 
        status: 'ASSIGNED', 
        aadhaarId: '7721-3490-6543', 
        notes: 'Individual lunch boxes packed fresh. Ready at back kitchen door.',
        isVegetarian: true 
      },
      { upsert: true, new: true }
    );

    // Donation 3: Available donation (ready for NGO to browse and request)
    const donation3 = await FoodDonation.findOneAndUpdate(
      { aadhaarId: '8899-2341-9988' },
      { 
        donorId: donor._id, 
        locationId: locSupermarket._id, 
        donationDate: now, 
        quantity: 50, 
        unit: 'kg', 
        foodType: 'Fresh Apples, Bananas & Seasonal Greens', 
        foodCategory: 'Raw', 
        preparationTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        expiryTime: expiryFresh, 
        status: 'AVAILABLE', 
        aadhaarId: '8899-2341-9988', 
        notes: 'Surplus fresh fruit crates from morning inventory.',
        isVegetarian: true 
      },
      { upsert: true, new: true }
    );

    // 5. FOOD ITEMS
    console.log('Upserting food items...');
    await FoodItem.findOneAndUpdate(
      { donationId: donation1._id },
      { 
        donationId: donation1._id, 
        foodName: 'Dal Khichdi & Mixed Veg', 
        foodCategory: 'Cooked', 
        foodType: 'Cooked', 
        quantity: 60, 
        unit: 'servings', 
        isVegetarian: true 
      },
      { upsert: true }
    );

    await FoodItem.findOneAndUpdate(
      { donationId: donation2._id },
      { 
        donationId: donation2._id, 
        foodName: 'Paneer Butter Masala & Roti Packets', 
        foodCategory: 'Cooked', 
        foodType: 'Cooked', 
        quantity: 40, 
        unit: 'boxes', 
        isVegetarian: true 
      },
      { upsert: true }
    );

    await FoodItem.findOneAndUpdate(
      { donationId: donation3._id },
      { 
        donationId: donation3._id, 
        foodName: 'Fresh Fruits & Greens', 
        foodCategory: 'Raw', 
        foodType: 'Raw', 
        quantity: 50, 
        unit: 'kg', 
        isVegetarian: true 
      },
      { upsert: true }
    );

    // 6. DONATION REQUESTS
    console.log('Upserting donation requests...');
    const request1 = await DonationRequest.findOneAndUpdate(
      { donationId: donation1._id, ngoId: ngo._id },
      { 
        donationId: donation1._id, 
        ngoId: ngo._id, 
        requestedQuantity: 60, 
        requestDate: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        requestStatus: 'COMPLETED',
        message: 'Requesting meals for evening shelter distribution.'
      },
      { upsert: true, new: true }
    );

    const request2 = await DonationRequest.findOneAndUpdate(
      { donationId: donation2._id, ngoId: ngo._id },
      { 
        donationId: donation2._id, 
        ngoId: ngo._id, 
        requestedQuantity: 40, 
        requestDate: new Date(now.getTime() - 45 * 60 * 1000),
        requestStatus: 'ACCEPTED',
        message: 'Urgent request for transit workers and destitute families.'
      },
      { upsert: true, new: true }
    );

    // 7. PICKUPS & TRACKING HISTORY
    console.log('Upserting pickups and tracking history...');
    
    // Pickup 1: Fully completed & distributed workflow
    const t0 = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const t1 = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const t2 = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);
    const t3 = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const t4 = new Date(now.getTime() - 1.5 * 60 * 60 * 1000);

    const pickup1 = await Pickup.findOneAndUpdate(
      { requestId: request1._id },
      { 
        requestId: request1._id, 
        volunteerId: volunteer._id, 
        pickupDate: t0,
        pickupTime: '11:00 AM',
        pickupStatus: 'DISTRIBUTED',
        notes: 'Seamless pickup from kitchen dock.',
        statusHistory: [
          { status: 'ASSIGNED', changedBy: donorUser._id, changedAt: t0, note: 'Pickup created upon request acceptance' },
          { status: 'RECEIVED', changedBy: volunteerUser._id, changedAt: t1, note: 'Volunteer collected 60 servings from donor' },
          { status: 'DISPATCHED', changedBy: volunteerUser._id, changedAt: t2, note: 'Vehicle departed toward Asha Community Kitchen' },
          { status: 'DELIVERED', changedBy: volunteerUser._id, changedAt: t3, note: 'Safely delivered at shelter' },
          { status: 'DISTRIBUTED', changedBy: ngoUser._id, changedAt: t4, note: 'Food served to 120 community members' }
        ]
      },
      { upsert: true, new: true }
    );

    // Save tracking history records in pickupTracking collection for pickup 1
    const trackingEntries1 = [
      { pickupId: pickup1._id, status: 'ASSIGNED', changedBy: donorUser._id, changedAt: t0, note: 'Pickup created upon request acceptance' },
      { pickupId: pickup1._id, status: 'RECEIVED', changedBy: volunteerUser._id, changedAt: t1, note: 'Volunteer collected 60 servings from donor' },
      { pickupId: pickup1._id, status: 'DISPATCHED', changedBy: volunteerUser._id, changedAt: t2, note: 'Vehicle departed toward Asha Community Kitchen' },
      { pickupId: pickup1._id, status: 'DELIVERED', changedBy: volunteerUser._id, changedAt: t3, note: 'Safely delivered at shelter' },
      { pickupId: pickup1._id, status: 'DISTRIBUTED', changedBy: ngoUser._id, changedAt: t4, note: 'Food served to 120 community members' }
    ];

    for (const entry of trackingEntries1) {
      await PickupTracking.findOneAndUpdate(
        { pickupId: entry.pickupId, status: entry.status },
        entry,
        { upsert: true }
      );
    }

    // Pickup 2: Active workflow currently ASSIGNED (Volunteer can click "Food Received" -> "Dispatched" -> "Delivered")
    const p2Time = new Date(now.getTime() - 30 * 60 * 1000);
    const pickup2 = await Pickup.findOneAndUpdate(
      { requestId: request2._id },
      { 
        requestId: request2._id, 
        volunteerId: volunteer._id, 
        pickupDate: p2Time,
        pickupTime: '02:30 PM',
        pickupStatus: 'ASSIGNED',
        notes: 'Handle with care. Hot food containers.',
        statusHistory: [
          { status: 'ASSIGNED', changedBy: donorUser._id, changedAt: p2Time, note: 'Assigned to Vikram Joshi (Van)' }
        ]
      },
      { upsert: true, new: true }
    );

    await PickupTracking.findOneAndUpdate(
      { pickupId: pickup2._id, status: 'ASSIGNED' },
      { 
        pickupId: pickup2._id, 
        status: 'ASSIGNED', 
        changedBy: donorUser._id, 
        changedAt: p2Time, 
        note: 'Assigned to Vikram Joshi (Van)' 
      },
      { upsert: true }
    );

    // 8. DISTRIBUTIONS
    console.log('Upserting distributions...');
    await Distribution.findOneAndUpdate(
      { pickupId: pickup1._id },
      { 
        pickupId: pickup1._id, 
        ngoId: ngo._id, 
        distributionDate: t4,
        quantityDistributed: 60, 
        beneficiaryCount: 120, 
        distributionStatus: 'COMPLETED', 
        notes: 'Meals served hot to 120 shelter residents.' 
      },
      { upsert: true }
    );

    // Distribution record for pickup 2 is PENDING
    await Distribution.findOneAndUpdate(
      { pickupId: pickup2._id },
      { 
        pickupId: pickup2._id, 
        ngoId: ngo._id, 
        distributionStatus: 'PENDING', 
        notes: 'Scheduled for evening community meal.' 
      },
      { upsert: true }
    );

    console.log('==============================================');
    console.log('SEED COMPLETED SUCCESSFULLY!');
    console.log('==============================================');
    console.log('Demo Accounts:');
    console.log('  ADMIN:     admin@smartfoodrescue.com     / Admin@123');
    console.log('  DONOR:     donor@smartfoodrescue.com     / Donor@123');
    console.log('  NGO:       ngo@smartfoodrescue.com       / Ngo@123');
    console.log('  VOLUNTEER: volunteer@smartfoodrescue.com / Volunteer@123');
    console.log('==============================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed execution failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
