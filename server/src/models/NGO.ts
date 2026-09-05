import mongoose, { Document, Schema } from 'mongoose';

export interface INGO extends Document {
  userId: mongoose.Types.ObjectId;
  ngoName: string;
  registrationNo: string;
  contactNo: string;
  contactEmail: string;
  locationId: mongoose.Types.ObjectId;
  isVerified: boolean;
  capacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ngoSchema = new Schema<INGO>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ngoName: { type: String, required: true },
  registrationNo: { type: String, required: true },
  contactNo: { type: String, required: true },
  contactEmail: { type: String, required: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  isVerified: { type: Boolean, default: false },
  capacity: { type: Number }
}, { timestamps: true });

export default mongoose.model<INGO>('NGO', ngoSchema, 'ngos');
