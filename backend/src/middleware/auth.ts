import { Context, Next } from 'hono';
import { verifyToken } from '../utils/auth';
import { Env } from '../types/env';

export async function auth() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await verifyToken(token, c.env.JWT_SECRET);
      c.set('user', payload);
      await next();
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401);
    }
  };
} 