import mongoose, { Document, Schema } from 'mongoose';

export interface IDonor extends Document {
  userId: mongoose.Types.ObjectId;
  donorType: 'Restaurant' | 'Hotel' | 'College' | 'Supermarket' | 'Event Organizer' | 'Individual' | 'Other';
  organizationName?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  locationId: mongoose.Types.ObjectId;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const donorSchema = new Schema<IDonor>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  donorType: { type: String, enum: ['Restaurant', 'Hotel', 'College', 'Supermarket', 'Event Organizer', 'Individual', 'Other'], required: true },
  organizationName: { type: String },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: { type: String, required: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IDonor>('Donor', donorSchema, 'donors');
