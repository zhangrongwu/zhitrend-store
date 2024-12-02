import { sign, verify } from 'hono/jwt';
import * as bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(payload: any): Promise<string> {
  return sign(payload, 'your-secret-key');
}

export async function verifyToken(token: string): Promise<any> {
  return verify(token, 'your-secret-key');
} 