import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/models/User';
import Donor from '../src/models/Donor';
import NGO from '../src/models/NGO';
import Volunteer from '../src/models/Volunteer';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const emails = ['sumitghogare824@gmail.com', 'sumitghogare2007@gmail.com'];
  const users = await User.find({ email: { $in: emails } });
  for (const user of users) {
    await Donor.deleteMany({ userId: user._id });
    await NGO.deleteMany({ userId: user._id });
    await Volunteer.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);
    console.log(`Removed incomplete user: ${user.email}`);
  }
  console.log('Cleanup finished.');
  await mongoose.disconnect();
}

run();
