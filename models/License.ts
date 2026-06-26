import { Schema, model, Document, Types } from 'mongoose';

export interface IActivatedDevice {
  deviceId: string;
  hwid: string;
  deviceName?: string;
  activatedAt: Date;
  lastCheckIn: Date;
}

export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'revoked';
export type LicenseTier = 'trial' | 'standard' | 'premium';

export interface ILicense extends Document {
  licenseKey: string;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  status: LicenseStatus;
  tier: LicenseTier;
  maxDevices: number;
  activatedDevices: IActivatedDevice[];
  expiresAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivatedDeviceSchema = new Schema<IActivatedDevice>(
  {
    deviceId: { type: String, required: true },
    hwid: { type: String, required: true },
    deviceName: { type: String },
    activatedAt: { type: Date, default: Date.now },
    lastCheckIn: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LicenseSchema = new Schema<ILicense>(
  {
    licenseKey: { type: String, required: true, unique: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended', 'revoked'],
      default: 'active',
    },
    tier: {
      type: String,
      enum: ['trial', 'standard', 'premium'],
      required: true,
    },
    maxDevices: { type: Number, default: 1 },
    activatedDevices: { type: [ActivatedDeviceSchema], default: [] },
    expiresAt: { type: Date, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

LicenseSchema.index({ userId: 1, productId: 1 });
LicenseSchema.index({ status: 1, expiresAt: 1 });
LicenseSchema.index({ 'activatedDevices.hwid': 1 });

export const License = model<ILicense>('License', LicenseSchema);
