import crypto from 'node:crypto';
import os from 'node:os';
import { execSync } from 'node:child_process';

const parts = [];

// CPU ID (Windows)
try {
  const cpu = execSync('wmic cpu get processorid /format:value', { encoding: 'utf-8', timeout: 3000 });
  const m = cpu.match(/ProcessorId=(.+)/);
  if (m) parts.push(m[1].trim());
} catch {}

// Motherboard serial
try {
  const board = execSync('wmic baseboard get serialnumber /format:value', { encoding: 'utf-8', timeout: 3000 });
  const m = board.match(/SerialNumber=(.+)/);
  if (m) parts.push(m[1].trim());
} catch {}

// Disk serial
try {
  const disk = execSync('wmic diskdrive get serialnumber /format:value', { encoding: 'utf-8', timeout: 3000 });
  const m = disk.match(/SerialNumber=(.+)/);
  if (m) parts.push(m[1].trim());
} catch {}

// MAC addresses
const ifaces = os.networkInterfaces();
for (const name of Object.keys(ifaces)) {
  for (const iface of ifaces[name] ?? []) {
    if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
      parts.push(iface.mac);
    }
  }
}

parts.push(os.hostname());
parts.push(os.userInfo().username);

parts.sort();
const hwid = crypto.createHash('sha256').update(parts.join('|')).digest('hex');

console.log('HWID:', hwid);
