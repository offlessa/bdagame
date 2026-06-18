import crypto from 'crypto';

interface TokenData {
  userId: string;
  email: string;
  expires: number;
}

const store = new Map<string, TokenData>();

export function generateCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

export function storeToken(code: string, userId: string, email: string): void {
  store.set(code, { userId, email, expires: Date.now() + 15 * 60 * 1000 });
}

export function verifyToken(code: string): TokenData | null {
  const data = store.get(code);
  if (!data) return null;
  if (Date.now() > data.expires) { store.delete(code); return null; }
  return data;
}

export function deleteToken(code: string): void {
  store.delete(code);
}
