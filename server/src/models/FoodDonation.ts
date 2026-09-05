import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodDonation extends Document {
  donorId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  donationDate: Date;
  quantity: number;
  unit: string;
  foodType: string;
  foodCategory: string;
  preparationTime?: Date;
  expiryTime: Date;
  status: 'AVAILABLE' | 'REQUESTED' | 'ACCEPTED' | 'ASSIGNED' | 'RECEIVED' | 'DISPATCHED' | 'PICKED_UP' | 'DELIVERED' | 'DISTRIBUTED' | 'EXPIRED' | 'CANCELLED';
  aadhaarId?: string;
  notes?: string;
  isVegetarian: boolean;
  createdAt: Date;
  updatedAt: Date;
  isExpired: boolean;
  expiryLabel: string;
}

const foodDonationSchema = new Schema<IFoodDonation>({
  donorId: { type: Schema.Types.ObjectId, ref: 'Donor', required: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  donationDate: { type: Date, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  foodType: { type: String, required: true },
  foodCategory: { type: String, required: true },
  preparationTime: { type: Date },
  expiryTime: { type: Date, required: true },
  status: { type: String, enum: ['AVAILABLE', 'REQUESTED', 'ACCEPTED', 'ASSIGNED', 'RECEIVED', 'DISPATCHED', 'PICKED_UP', 'DELIVERED', 'DISTRIBUTED', 'EXPIRED', 'CANCELLED'], default: 'AVAILABLE' },
  aadhaarId: { type: String },
  notes: { type: String },
  isVegetarian: { type: Boolean, required: true }
}, { timestamps: true });

foodDonationSchema.index({ status: 1 });
foodDonationSchema.index({ expiryTime: 1 });
foodDonationSchema.index({ donorId: 1 });

foodDonationSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiryTime;
});

foodDonationSchema.virtual('expiryLabel').get(function () {
  const now = new Date();
  if (now > this.expiryTime) return 'Expired';
  const diffHours = (this.expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < 2) return 'Urgent';
  if (diffHours < 6) return 'Expiring Soon';
  return 'Fresh';
});

foodDonationSchema.set('toJSON', { virtuals: true });
foodDonationSchema.set('toObject', { virtuals: true });

export default mongoose.model<IFoodDonation>('FoodDonation', foodDonationSchema, 'foodDonations');
