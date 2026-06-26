import { Router, Request, Response } from 'express';
import { License } from '../../models/License';
import { AuditLog } from '../../models/AuditLog';
import { hashLicenseKey, signLicensePayload } from '../utils/crypto';
import { hashChain } from '../utils/hashchain';
import { checkNonce, storeNonce } from '../utils/nonce';

const router = Router();

router.post('/validate', async (req: Request, res: Response) => {
  const { licenseKey, hwid, nonce } = req.body;

  if (!licenseKey || !hwid || !nonce) {
    res.status(400).json({ error: 'licenseKey, hwid, and nonce are required' });
    return;
  }

  const nonceUsed = await checkNonce(nonce);
  if (nonceUsed) {
    res.status(429).json({ error: 'Nonce already used — possible replay attack' });
    return;
  }
  await storeNonce(nonce);

  const hashedKey = hashLicenseKey(licenseKey);
  const license = await License.findOne({ licenseKey: hashedKey });

  if (!license) {
    res.status(404).json({ error: 'License not found' });
    return;
  }

  if (license.status !== 'active') {
    res.status(403).json({ error: `License is ${license.status}` });
    return;
  }

  if (license.expiresAt < new Date()) {
    license.status = 'expired';
    await license.save();
    res.status(403).json({ error: 'License has expired' });
    return;
  }

  const device = license.activatedDevices.find(d => d.hwid === hwid);
  if (!device) {
    res.status(403).json({ error: 'Hardware not authorized for this license' });
    return;
  }

  device.lastCheckIn = new Date();
  await license.save();

  await AuditLog.create({
    ...(await hashChain({
      licenseId: license._id,
      action: 'validate',
      payload: { hwid, deviceId: device.deviceId },
      ip: req.ip ?? '',
      userAgent: req.headers['user-agent'],
    })),
  });

  const populated = await license.populate<{ productId: { features: string[] } }>('productId');
  const features = populated.productId?.features ?? [];

  const token = await signLicensePayload({
    sub: license._id.toString(),
    tier: license.tier,
    deviceId: device.deviceId,
    features,
    nonce,
  });

  res.json({
    valid: true,
    tier: license.tier,
    expiresAt: license.expiresAt,
    token,
  });
});

export default router;
