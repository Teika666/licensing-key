import { Nonce } from '../../models/Nonce';

export async function checkNonce(nonce: string): Promise<boolean> {
  const exists = await Nonce.findOne({ nonce });
  return exists !== null;
}

export async function storeNonce(nonce: string): Promise<void> {
  await Nonce.create({ nonce });
}
