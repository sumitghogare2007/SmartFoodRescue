import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  // Normalize MONGODB_URI and force lowercase database name 'smartfoodrescue'
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartfoodrescue';

  // Replace /SmartFoodRescue (case-insensitive) in URI path with /smartfoodrescue
  uri = uri.replace(/\/SmartFoodRescue(?=[\/?]|$)/i, '/smartfoodrescue');

  const isAtlas = uri.includes('+srv');

  try {
    const options: mongoose.ConnectOptions = {};
    if (isAtlas) {
      options.dbName = 'smartfoodrescue';
    }
    await mongoose.connect(uri, options);
    console.log(`MongoDB connected successfully (${isAtlas ? 'MongoDB Atlas' : 'Local Community Server'}) -> Database: ${mongoose.connection.db?.databaseName}`);
  } catch (error: any) {
    console.error('MongoDB connection error:', error?.message || error);
    if (isAtlas) {
      console.error('Atlas Troubleshooting: Verify credentials in MONGODB_URI and verify MongoDB Atlas Network Access allows 0.0.0.0/0');
    } else {
      console.error('Local Troubleshooting: Ensure MongoDB Community Server is running on mongodb://127.0.0.1:27017');
    }
    process.exit(1);
  }
};

export default connectDB;
