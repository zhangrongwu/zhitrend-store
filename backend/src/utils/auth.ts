import { sign, verify } from 'hono/jwt';
import { hash, compare } from 'bcryptjs';

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// 密码验证
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

// 生成JWT token
export async function generateToken(payload: any, secret: string): Promise<string> {
  return sign(payload, secret);
}

// 验证JWT token
export async function verifyToken(token: string, secret: string): Promise<any> {
  return verify(token, secret);
} 