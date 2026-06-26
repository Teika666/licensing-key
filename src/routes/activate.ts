import crypto from 'node:crypto';
import { Router, Request, Response } from 'express';
import { License } from '../../models/License';
import { AuditLog } from '../../models/AuditLog';
import { hashLicenseKey, signLicensePayload } from '../utils/crypto';
import { hashChain } from '../utils/hashchain';

const router = Router();

router.post('/activate', async (req: Request, res: Response) => {
  const { licenseKey, hwid, deviceName } = req.body;

  if (!licenseKey || !hwid) {
    res.status(400).json({ error: 'licenseKey and hwid are required' });
    return;
  }

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
    res.status(403).json({ error: 'License has expired' });
    return;
  }

  const existingDevice = license.activatedDevices.find(d => d.hwid === hwid);
  if (existingDevice) {
    existingDevice.lastCheckIn = new Date();
    await license.save();
    const token = await signLicensePayload({
      sub: license._id.toString(),
      tier: license.tier,
      deviceId: existingDevice.deviceId,
    });
    res.json({ activated: true, deviceId: existingDevice.deviceId, token });
    return;
  }

  if (license.activatedDevices.length >= license.maxDevices) {
    res.status(429).json({ error: 'Maximum device limit reached' });
    return;
  }

  const deviceId = crypto.randomUUID();
  license.activatedDevices.push({
    deviceId,
    hwid,
    deviceName: deviceName || 'unknown',
    activatedAt: new Date(),
    lastCheckIn: new Date(),
  });

  await license.save();

  await AuditLog.create({
    ...(await hashChain({
      licenseId: license._id,
      action: 'activate',
      payload: { hwid, deviceName, deviceId },
      ip: req.ip ?? '',
      userAgent: req.headers['user-agent'],
    })),
  });

  const token = await signLicensePayload({
    sub: license._id.toString(),
    tier: license.tier,
    deviceId,
  });

  res.status(201).json({ activated: true, deviceId, token });
});

export default router;
