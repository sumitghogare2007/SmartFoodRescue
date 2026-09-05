import mongoose, { Document, Schema } from 'mongoose';

export interface IVolunteer extends Document {
  userId: mongoose.Types.ObjectId;
  availability: 'Available' | 'Busy' | 'Offline';
  vehicleType: 'Bicycle' | 'Bike' | 'Car' | 'Van' | 'Other';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const volunteerSchema = new Schema<IVolunteer>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  availability: { type: String, enum: ['Available', 'Busy', 'Offline'], default: 'Offline' },
  vehicleType: { type: String, enum: ['Bicycle', 'Bike', 'Car', 'Van', 'Other'], required: true },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IVolunteer>('Volunteer', volunteerSchema, 'volunteers');
