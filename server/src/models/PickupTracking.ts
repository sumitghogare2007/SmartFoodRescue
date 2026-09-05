import mongoose, { Document, Schema } from 'mongoose';

export interface IPickupTracking extends Document {
  pickupId: mongoose.Types.ObjectId;
  status: 'ASSIGNED' | 'RECEIVED' | 'DISPATCHED' | 'DELIVERED' | 'DISTRIBUTED';
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pickupTrackingSchema = new Schema<IPickupTracking>({
  pickupId: { type: Schema.Types.ObjectId, ref: 'Pickup', required: true },
  status: { 
    type: String, 
    enum: ['ASSIGNED', 'RECEIVED', 'DISPATCHED', 'DELIVERED', 'DISTRIBUTED'], 
    required: true 
  },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now },
  note: { type: String }
}, { timestamps: true });

pickupTrackingSchema.index({ pickupId: 1 });
pickupTrackingSchema.index({ changedAt: 1 });

export default mongoose.model<IPickupTracking>('PickupTracking', pickupTrackingSchema, 'pickupTracking');
