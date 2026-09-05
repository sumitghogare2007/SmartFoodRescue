import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SmartFoodRescue';
  const isAtlas = uri.includes('+srv');

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected successfully (${isAtlas ? 'MongoDB Atlas' : 'Local Community Server'})`);
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
