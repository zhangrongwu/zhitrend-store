import { Hono } from 'hono';
import { Env } from '../types/env';
import { auth } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// 获取收藏列表
app.get('/api/favorites', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');

  try {
    const favorites = await DB.prepare(`
      SELECT 
        f.id,
        f.created_at,
        p.id as product_id,
        p.name,
        p.description,
        p.price,
        p.image
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).bind(user.id).all();

    return c.json(favorites.results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch favorites' }, 500);
  }
});

// 添加收藏
app.post('/api/favorites', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const { productId } = await c.req.json();

  try {
    await DB.prepare(`
      INSERT INTO favorites (user_id, product_id)
      VALUES (?, ?)
    `).bind(user.id, productId).run();

    return c.json({ success: true });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Already in favorites' }, 400);
    }
    return c.json({ error: 'Failed to add to favorites' }, 500);
  }
});

// 取消收藏
app.delete('/api/favorites/:id', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const favoriteId = c.req.param('id');

  try {
    await DB.prepare(`
      DELETE FROM favorites 
      WHERE id = ? AND user_id = ?
    `).bind(favoriteId, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to remove from favorites' }, 500);
  }
});

// 检查是否已收藏
app.get('/api/favorites/check/:productId', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const productId = c.req.param('productId');

  try {
    const favorite = await DB.prepare(`
      SELECT id FROM favorites 
      WHERE user_id = ? AND product_id = ?
    `).bind(user.id, productId).first();

    return c.json({ isFavorited: !!favorite });
  } catch (error) {
    return c.json({ error: 'Failed to check favorite status' }, 500);
  }
});

export default app; 