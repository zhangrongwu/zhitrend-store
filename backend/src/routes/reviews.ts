import { Hono } from 'hono';
import { Env } from '../types/env';
import { auth } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// 获取商品评价
app.get('/api/products/:id/reviews', async (c) => {
  const { DB } = c.env;
  const productId = c.req.param('id');

  try {
    const reviews = await DB.prepare(`
      SELECT 
        r.*,
        u.name as user_name,
        COUNT(rl.id) as likes_count,
        EXISTS(
          SELECT 1 FROM rating_likes rl2 
          WHERE rl2.rating_id = r.id AND rl2.user_id = ?
        ) as is_liked,
        json_group_array(
          json_object(
            'id', rr.id,
            'user_name', ru.name,
            'content', rr.content,
            'created_at', rr.created_at
          )
        ) as replies
      FROM ratings r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rating_likes rl ON r.id = rl.rating_id
      LEFT JOIN rating_replies rr ON r.id = rr.rating_id
      LEFT JOIN users ru ON rr.user_id = ru.id
      WHERE r.product_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `).bind(c.get('user')?.id || 0, productId).all();

    // 解析replies字符串为JSON
    const parsedReviews = reviews.results.map(review => ({
      ...review,
      replies: JSON.parse(review.replies)
    }));

    return c.json(parsedReviews);
  } catch (error) {
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// 创建评价
app.post('/api/products/:id/reviews', auth(), async (c) => {
  const { DB } = c.env;
  const productId = c.req.param('id');
  const user = c.get('user');
  const { rating, comment, orderId } = await c.req.json();

  try {
    // 检查是否已经评价过
    const existingReview = await DB.prepare(`
      SELECT id FROM ratings 
      WHERE user_id = ? AND product_id = ? AND order_id = ?
    `).bind(user.id, productId, orderId).first();

    if (existingReview) {
      return c.json({ error: 'Already reviewed' }, 400);
    }

    // 创建评价
    const result = await DB.prepare(`
      INSERT INTO ratings (user_id, product_id, order_id, score, comment)
      VALUES (?, ?, ?, ?, ?)
    `).bind(user.id, productId, orderId, rating, comment).run();

    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to create review' }, 500);
  }
});

// 点赞评价
app.post('/api/ratings/:id/like', auth(), async (c) => {
  const { DB } = c.env;
  const ratingId = c.req.param('id');
  const user = c.get('user');

  try {
    // 检查是否已点赞
    const existingLike = await DB.prepare(`
      SELECT id FROM rating_likes 
      WHERE rating_id = ? AND user_id = ?
    `).bind(ratingId, user.id).first();

    if (existingLike) {
      // 取消点赞
      await DB.prepare(`
        DELETE FROM rating_likes 
        WHERE rating_id = ? AND user_id = ?
      `).bind(ratingId, user.id).run();
    } else {
      // 添加点赞
      await DB.prepare(`
        INSERT INTO rating_likes (rating_id, user_id)
        VALUES (?, ?)
      `).bind(ratingId, user.id).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to toggle like' }, 500);
  }
});

// 回复评价
app.post('/api/ratings/:id/reply', auth(), async (c) => {
  const { DB } = c.env;
  const ratingId = c.req.param('id');
  const user = c.get('user');
  const { content } = await c.req.json();

  try {
    const result = await DB.prepare(`
      INSERT INTO rating_replies (rating_id, user_id, content)
      VALUES (?, ?, ?)
    `).bind(ratingId, user.id, content).run();

    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to create reply' }, 500);
  }
});

export default app; 