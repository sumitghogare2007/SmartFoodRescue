import mongoose from 'mongoose';

const resolveDatabaseName = async (baseUri: string): Promise<string> => {
  try {
    const tempConn = await mongoose.createConnection(baseUri, { serverSelectionTimeoutMS: 2500 }).asPromise();
    const admin = tempConn.db.admin();
    const dbs = await admin.listDatabases();
    await tempConn.close();
    const found = dbs.databases.find((d: any) => d.name.toLowerCase() === 'smartfoodrescue');
    if (found) {
      return found.name;
    }
  } catch {
    // If listing fails, fallback
  }
  return 'SmartFoodRescue';
};

export const connectDB = async (): Promise<void> => {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SmartFoodRescue';
  const isAtlas = uri.includes('+srv');

  try {
    const options: mongoose.ConnectOptions = {};
    if (isAtlas) {
      options.dbName = 'smartfoodrescue';
    } else if (!uri.split('?')[0].includes('/', 10)) {
      // If no database name was provided in local URI, resolve it
      const dbName = await resolveDatabaseName('mongodb://127.0.0.1:27017');
      uri = `${uri.replace(/\/+$/, '')}/${dbName}`;
    }
    await mongoose.connect(uri, options);
    console.log(`MongoDB connected successfully (${isAtlas ? 'MongoDB Atlas' : 'Local Community Server'}) -> Database: ${mongoose.connection.db?.databaseName}`);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && isAtlas) {
      console.warn(`[MongoDB] Atlas connection failed (${error.message}). Falling back to local MongoDB...`);
      try {
        const localDbName = await resolveDatabaseName('mongodb://127.0.0.1:27017');
        await mongoose.connect(`mongodb://127.0.0.1:27017/${localDbName}`);
        console.log(`MongoDB connected successfully (Local Community Server: ${localDbName}) -> Database: ${mongoose.connection.db?.databaseName}`);
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
