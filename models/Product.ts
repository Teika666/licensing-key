import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  productName: string;
  version: string;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    productName: { type: String, required: true, trim: true },
    version: { type: String, required: true },
    features: [{ type: String }],
  },
  { timestamps: true }
);

export const Product = model<IProduct>('Product', ProductSchema);
