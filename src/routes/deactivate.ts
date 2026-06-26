import { Router, Request, Response } from 'express';
import { License } from '../../models/License';
import { AuditLog } from '../../models/AuditLog';
import { hashLicenseKey } from '../utils/crypto';
import { hashChain } from '../utils/hashchain';

const router = Router();

router.post('/deactivate', async (req: Request, res: Response) => {
  const { licenseKey, hwid } = req.body;

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

  const idx = license.activatedDevices.findIndex(d => d.hwid === hwid);
  if (idx === -1) {
    res.status(404).json({ error: 'Device not found on this license' });
    return;
  }

  license.activatedDevices.splice(idx, 1);
  await license.save();

  await AuditLog.create({
    ...(await hashChain({
      licenseId: license._id,
      action: 'deactivate',
      payload: { hwid },
      ip: req.ip ?? '',
      userAgent: req.headers['user-agent'],
    })),
  });

  res.json({ deactivated: true });
});

export default router;
