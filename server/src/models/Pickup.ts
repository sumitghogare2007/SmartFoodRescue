import mongoose, { Document, Schema } from 'mongoose';

export interface IPickup extends Document {
  requestId: mongoose.Types.ObjectId;
  volunteerId?: mongoose.Types.ObjectId;
  pickupDate?: Date;
  pickupTime?: string;
  pickupStatus: 'ASSIGNED' | 'RECEIVED' | 'DISPATCHED' | 'DELIVERED' | 'DISTRIBUTED';
  notes?: string;
  statusHistory: {
    status: string;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const pickupSchema = new Schema<IPickup>({
  requestId: { type: Schema.Types.ObjectId, ref: 'DonationRequest', required: true },
  volunteerId: { type: Schema.Types.ObjectId, ref: 'Volunteer' },
  pickupDate: { type: Date },
  pickupTime: { type: String },
  pickupStatus: { type: String, enum: ['ASSIGNED', 'RECEIVED', 'DISPATCHED', 'DELIVERED', 'DISTRIBUTED'], default: 'ASSIGNED' },
  notes: { type: String },
  statusHistory: [{
    status: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String }
  }]
}, { timestamps: true });

pickupSchema.index({ volunteerId: 1 });
pickupSchema.index({ pickupStatus: 1 });

export default mongoose.model<IPickup>('Pickup', pickupSchema, 'pickups');
