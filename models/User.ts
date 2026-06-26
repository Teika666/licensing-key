import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  companyName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    companyName: { type: String, trim: true },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
