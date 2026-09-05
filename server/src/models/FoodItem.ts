import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodItem extends Document {
  donationId: mongoose.Types.ObjectId;
  foodName: string;
  foodCategory: string;
  foodType: string;
  quantity: number;
  unit: string;
  isVegetarian: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const foodItemSchema = new Schema<IFoodItem>({
  donationId: { type: Schema.Types.ObjectId, ref: 'FoodDonation', required: true },
  foodName: { type: String, required: true },
  foodCategory: { type: String, required: true },
  foodType: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  isVegetarian: { type: Boolean, required: true }
}, { timestamps: true });

export default mongoose.model<IFoodItem>('FoodItem', foodItemSchema, 'foodItems');
