import { Context, Next } from 'hono';
import { verify } from '../utils/auth';
import { Env } from '../types/env';

export async function auth() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await verify(token, c.env.JWT_SECRET);
      c.set('jwtPayload', payload);
      await next();
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401);
    }
  };
} 