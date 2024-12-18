import { Context, Next } from 'hono';
import { verify } from '../utils/auth';
import { Env } from '../types/env';

export async function adminAuth() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await verify(token, c.env.JWT_SECRET);
      const { DB } = c.env;
      
      // 检查用户是否是管理员
      const user = await DB.prepare(
        'SELECT role FROM users WHERE id = ?'
      ).bind(payload.id).first();

      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Forbidden' }, 403);
      }

      c.set('jwtPayload', payload);
      await next();
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401);
    }
  };
} 