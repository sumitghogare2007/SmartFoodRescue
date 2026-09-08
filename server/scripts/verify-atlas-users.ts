import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function check() {
  const uri = (process.env.MONGODB_URI || '').replace(/\/SmartFoodRescue(?=[\/?]|$)/i, '/smartfoodrescue');
  console.log('Connecting to:', uri.replace(/:([^:@]+)@/, ':****@'));
  
  await mongoose.connect(uri, { dbName: 'smartfoodrescue' });
  const dbName = mongoose.connection.db?.databaseName;
  console.log(`Connected successfully! Database name is: "${dbName}"`);

  const collections = await mongoose.connection.db?.listCollections().toArray();
  console.log('Collections in Atlas:', collections?.map(c => c.name));

  const users = await mongoose.connection.db?.collection('users').find({}).toArray();
  console.log('Total users in smartfoodrescue:', users?.length);
  for (const u of (users || [])) {
    console.log(`  - ${u.email} (${u.userType})`);
  }

  await mongoose.disconnect();
}

check().catch(err => {
  console.error('Atlas check failed:', err);
  process.exit(1);
});
