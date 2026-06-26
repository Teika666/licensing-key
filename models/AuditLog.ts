import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  licenseId: Types.ObjectId;
  action: string;
  payload: Record<string, unknown>;
  ip: string;
  userAgent?: string;
  timestamp: Date;
  previousHash: string;
  hash: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  licenseId: { type: Schema.Types.ObjectId, ref: 'License', required: true },
  action: { type: String, required: true },
  payload: { type: Schema.Types.Mixed },
  ip: { type: String, required: true },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
  previousHash: { type: String, required: true },
  hash: { type: String, required: true },
});

AuditLogSchema.index({ licenseId: 1, timestamp: -1 });
AuditLogSchema.index({ hash: 1 }, { unique: true });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
