import { Schema, model, Document } from 'mongoose';

export interface INonce extends Document {
  nonce: string;
  createdAt: Date;
}

const NonceSchema = new Schema<INonce>({
  nonce: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

NonceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

export const Nonce = model<INonce>('Nonce', NonceSchema);
