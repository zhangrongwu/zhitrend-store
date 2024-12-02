import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

export async function adminAuth(c: Context, next: Next) {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const payload = await verify(token, 'your-secret-key');
    const { DB } = c.env;
    
    const user = await DB.prepare(
      'SELECT role FROM users WHERE id = ?'
    )
    .bind(payload.id)
    .first();

    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
} 