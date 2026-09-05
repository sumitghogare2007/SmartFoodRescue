import mongoose, { Document, Schema } from 'mongoose';

export interface IDistribution extends Document {
  pickupId: mongoose.Types.ObjectId;
  ngoId: mongoose.Types.ObjectId;
  distributionDate?: Date;
  quantityDistributed?: number;
  beneficiaryCount?: number;
  distributionStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const distributionSchema = new Schema<IDistribution>({
  pickupId: { type: Schema.Types.ObjectId, ref: 'Pickup', required: true },
  ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
  distributionDate: { type: Date },
  quantityDistributed: { type: Number },
  beneficiaryCount: { type: Number },
  distributionStatus: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
  notes: { type: String }
}, { timestamps: true });

distributionSchema.index({ ngoId: 1 });

export default mongoose.model<IDistribution>('Distribution', distributionSchema, 'distributions');
