import { Hono } from 'hono';
import { Env } from '../types/env';
import { auth } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// 获取购物车
app.get('/api/cart', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');

  try {
    const items = await DB.prepare(`
      SELECT 
        ci.id,
        ci.product_id,
        ci.quantity,
        p.name,
        p.price,
        p.image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `)
    .bind(user.id)
    .all();

    return c.json(items.results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch cart' }, 500);
  }
});

// 添加到购物车
app.post('/api/cart', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const { productId, quantity } = await c.req.json();

  try {
    // 检查商品是否存在
    const product = await DB.prepare(
      'SELECT id FROM products WHERE id = ?'
    )
    .bind(productId)
    .first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // 检查购物车是否已有该商品
    const existingItem = await DB.prepare(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
    )
    .bind(user.id, productId)
    .first();

    if (existingItem) {
      // 更新数量
      await DB.prepare(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?'
      )
      .bind(quantity, existingItem.id)
      .run();
    } else {
      // 新增商品
      await DB.prepare(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
      )
      .bind(user.id, productId, quantity)
      .run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to add to cart' }, 500);
  }
});

// 更新购物车商品数量
app.put('/api/cart/:id', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const itemId = c.req.param('id');
  const { quantity } = await c.req.json();

  try {
    await DB.prepare(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?'
    )
    .bind(quantity, itemId, user.id)
    .run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update cart' }, 500);
  }
});

// 删除购物车商品
app.delete('/api/cart/:id', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const itemId = c.req.param('id');

  try {
    await DB.prepare(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?'
    )
    .bind(itemId, user.id)
    .run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to remove from cart' }, 500);
  }
});

// 获取购物车商品数量
app.get('/api/cart/count', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');

  try {
    const result = await DB.prepare(
      'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?'
    )
    .bind(user.id)
    .first();

    return c.json({ count: result.count });
  } catch (error) {
    return c.json({ error: 'Failed to fetch cart count' }, 500);
  }
});

export default app; 