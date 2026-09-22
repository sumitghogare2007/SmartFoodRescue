import mongoose, { Document, Schema } from 'mongoose';

export interface IPickupLiveLocation extends Document {
  pickupId: mongoose.Types.ObjectId;
  trackingSessionId: string;
  volunteerId: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  status: 'ACTIVE' | 'ARRIVED' | 'STOPPED';
  updatedAt: Date;
}

const pickupLiveLocationSchema = new Schema<IPickupLiveLocation>({
  pickupId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Pickup', 
    required: true, 
    unique: true 
  },
  trackingSessionId: { 
    type: String, 
    required: true, 
    index: true 
  },
  volunteerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Volunteer', 
    required: true 
  },
  latitude: { 
    type: Number, 
    required: true,
    min: -90,
    max: 90
  },
  longitude: { 
    type: Number, 
    required: true,
    min: -180,
    max: 180
  },
  accuracy: { type: Number },
  speed: { type: Number },
  heading: { type: Number },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'ARRIVED', 'STOPPED'], 
    default: 'ACTIVE' 
  },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

pickupLiveLocationSchema.index({ pickupId: 1 }, { unique: true });
pickupLiveLocationSchema.index({ volunteerId: 1 });
pickupLiveLocationSchema.index({ status: 1 });

export default mongoose.model<IPickupLiveLocation>('PickupLiveLocation', pickupLiveLocationSchema, 'pickupLiveLocations');
