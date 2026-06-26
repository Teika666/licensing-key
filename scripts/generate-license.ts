import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { License } from '../models/License';

function generateKey(): string {
  const seg = () => crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${seg()}-${seg()}-${seg()}`;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);

  const email = process.argv[2] || 'admin@example.com';
  const productName = process.argv[3] || 'MyApp';
  const tier = (process.argv[4] as any) || 'premium';
  const maxDevices = parseInt(process.argv[5] || '3', 10);
  const daysValid = parseInt(process.argv[6] || '365', 10);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, companyName: 'Default' });
    console.log(`Created user: ${email}`);
  }

  let product = await Product.findOne({ productName });
  if (!product) {
    product = await Product.create({ productName, version: '1.0.0', features: ['core'] });
    console.log(`Created product: ${productName}`);
  }

  const rawKey = generateKey();
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

  await License.create({
    licenseKey: hashedKey,
    productId: product._id,
    userId: user._id,
    status: 'active',
    tier,
    maxDevices,
    expiresAt: new Date(Date.now() + daysValid * 86400000),
  });

  console.log(`\nLicense key: ${rawKey}`);
  console.log(`Tier: ${tier} | Max devices: ${maxDevices} | Expires: ${daysValid} days`);
  console.log('\nUse this key with POST /api/v1/license/activate');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
