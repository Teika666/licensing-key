import crypto from 'node:crypto';
import { SignJWT } from 'jose';

const PRIVATE_KEY = crypto.createPrivateKey(Buffer.from(process.env.SIGNING_PRIVATE_KEY!, 'base64'));
const PUBLIC_KEY = crypto.createPublicKey(Buffer.from(process.env.SIGNING_PUBLIC_KEY!, 'base64'));

export async function signLicensePayload(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuer('license-system')
    .setExpirationTime('1h')
    .setIssuedAt()
    .sign(PRIVATE_KEY);
}

export function hashLicenseKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}
