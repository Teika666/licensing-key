import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AuditLog } from '../../models/AuditLog';

interface LogEntry {
  licenseId: mongoose.Types.ObjectId;
  action: string;
  payload: Record<string, unknown>;
  ip: string;
  userAgent?: string;
}

export async function hashChain(entry: LogEntry) {
  const lastLog = await AuditLog.findOne({ licenseId: entry.licenseId as any }, {}, { sort: { timestamp: -1 } as any });

  const previousHash = lastLog?.hash || crypto.createHash('sha256').update('GENESIS').digest('hex');
  const timestamp = new Date();
  const raw = `${previousHash}|${entry.licenseId.toString()}|${entry.action}|${JSON.stringify(entry.payload)}|${entry.ip}|${timestamp.toISOString()}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');

  return { ...entry, timestamp, previousHash, hash };
}
