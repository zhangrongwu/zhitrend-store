import { sign, verify as jwtVerify } from 'hono/jwt';
import { hash, compare } from 'bcryptjs';
import { JWTPayload } from '../types/user';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export async function generateToken(payload: JWTPayload, secret: string): Promise<string> {
  return sign(payload, secret);
}

export async function verify(token: string, secret: string): Promise<JWTPayload> {
  return jwtVerify(token, secret);
} 