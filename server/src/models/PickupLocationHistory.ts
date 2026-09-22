import mongoose, { Document, Schema } from 'mongoose';

export interface IPickupLocationHistory extends Document {
  pickupId: mongoose.Types.ObjectId;
  trackingSessionId?: string;
  volunteerId?: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

const pickupLocationHistorySchema = new Schema<IPickupLocationHistory>({
  pickupId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Pickup', 
    required: true,
    index: true 
  },
  trackingSessionId: { 
    type: String, 
    index: true 
  },
  volunteerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Volunteer' 
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
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

pickupLocationHistorySchema.index({ pickupId: 1, timestamp: -1 });

export default mongoose.model<IPickupLocationHistory>('PickupLocationHistory', pickupLocationHistorySchema, 'pickupLocationHistory');
