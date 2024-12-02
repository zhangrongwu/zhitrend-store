import { Hono } from 'hono';
import { Env } from '../types/env';
import { auth } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// 获取用户信息
app.get('/api/users/me', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');

  try {
    const result = await DB.prepare(
      'SELECT id, email, name, created_at FROM users WHERE id = ?'
    )
    .bind(user.id)
    .first();

    if (!result) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// 更新用户信息
app.put('/api/users/me', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const { name } = await c.req.json();

  try {
    await DB.prepare(
      'UPDATE users SET name = ? WHERE id = ?'
    )
    .bind(name, user.id)
    .run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// 修改密码
app.put('/api/users/me/password', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const { currentPassword, newPassword } = await c.req.json();

  try {
    const userData = await DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    )
    .bind(user.id)
    .first();

    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    const isValid = await comparePasswords(currentPassword, userData.password_hash);
    if (!isValid) {
      return c.json({ error: 'Current password is incorrect' }, 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    )
    .bind(hashedPassword, user.id)
    .run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update password' }, 500);
  }
});

export default app; 