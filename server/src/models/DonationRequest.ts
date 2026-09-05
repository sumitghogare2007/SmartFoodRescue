import mongoose, { Document, Schema } from 'mongoose';

export interface IDonationRequest extends Document {
  donationId: mongoose.Types.ObjectId;
  ngoId: mongoose.Types.ObjectId;
  requestedQuantity: number;
  requestDate: Date;
  requestStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'ASSIGNED' | 'COMPLETED';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const donationRequestSchema = new Schema<IDonationRequest>({
  donationId: { type: Schema.Types.ObjectId, ref: 'FoodDonation', required: true },
  ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
  requestedQuantity: { type: Number, required: true },
  requestDate: { type: Date, default: Date.now },
  requestStatus: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'ASSIGNED', 'COMPLETED'], default: 'PENDING' },
  message: { type: String }
}, { timestamps: true });

donationRequestSchema.index({ ngoId: 1 });
donationRequestSchema.index({ donationId: 1 });
donationRequestSchema.index({ requestStatus: 1 });

export default mongoose.model<IDonationRequest>('DonationRequest', donationRequestSchema, 'donationRequests');
