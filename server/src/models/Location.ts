import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  address: string;
  area: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>({
  address: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  latitude: { type: Number, min: -90, max: 90 },
  longitude: { type: Number, min: -180, max: 180 }
}, { timestamps: true });

export default mongoose.model<ILocation>('Location', locationSchema, 'locations');
