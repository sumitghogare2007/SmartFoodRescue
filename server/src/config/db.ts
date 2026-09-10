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
    if (process.env.NODE_ENV !== 'production' && isAtlas) {
      console.warn(`[MongoDB] Atlas connection failed (${error.message}). Falling back to local MongoDB...`);
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/smartfoodrescue');
        console.log(`MongoDB connected successfully (Local Community Server: smartfoodrescue) -> Database: ${mongoose.connection.db?.databaseName}`);
        return;
      } catch (localErr: any) {
        console.error('Local fallback failed:', localErr.message);
      }
    }
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
