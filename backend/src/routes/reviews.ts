import { Hono } from 'hono';
import { auth } from '../middleware/auth';

const reviews = new Hono();

// 获取商品评价
reviews.get('/:productId', async (c) => {
  const { DB } = c.env;
  const productId = c.req.param('productId');
  
  try {
    const reviews = await DB.prepare(`
      SELECT 
        r.*,
        u.name as user_name,
        (
          SELECT COUNT(*) 
          FROM rating_likes 
          WHERE rating_id = r.id
        ) as likes_count,
        (
          SELECT EXISTS(
            SELECT 1 
            FROM rating_likes 
            WHERE rating_id = r.id 
            AND user_id = ?
          )
        ) as is_liked,
        (
          SELECT json_group_array(
            json_object(
              'id', rr.id,
              'user_name', ru.name,
              'content', rr.content,
              'created_at', rr.created_at
            )
          )
          FROM rating_replies rr
          JOIN users ru ON rr.user_id = ru.id
          WHERE rr.rating_id = r.id
        ) as replies
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).bind(c.get('jwtPayload')?.id, productId).all();
    
    return c.json(reviews.results.map(review => ({
      ...review,
      replies: JSON.parse(review.replies || '[]'),
    })));
  } catch (error) {
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// 创建评价
reviews.post('/:productId', auth(), async (c) => {
  const { DB } = c.env;
  const productId = c.req.param('productId');
  const userId = c.get('jwtPayload').id;
  const { orderId, score, comment } = await c.req.json();
  
  try {
    // 检查是否已评价
    const existing = await DB.prepare(`
      SELECT id FROM ratings
      WHERE product_id = ? AND order_id = ?
    `).bind(productId, orderId).first();
    
    if (existing) {
      return c.json({ error: '已经评价过了' }, 400);
    }
    
    // 创建评价
    const result = await DB.prepare(`
      INSERT INTO ratings (
        user_id, product_id, order_id, score, comment
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId,
      productId,
      orderId,
      score,
      comment
    ).run();
    
    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to create review' }, 500);
  }
});

// 点赞评价
reviews.post('/:id/like', auth(), async (c) => {
  const { DB } = c.env;
  const ratingId = c.req.param('id');
  const userId = c.get('jwtPayload').id;
  
  try {
    // 检查是否已点赞
    const existing = await DB.prepare(`
      SELECT id FROM rating_likes
      WHERE rating_id = ? AND user_id = ?
    `).bind(ratingId, userId).first();
    
    if (existing) {
      // 取消点赞
      await DB.prepare(`
        DELETE FROM rating_likes
        WHERE rating_id = ? AND user_id = ?
      `).bind(ratingId, userId).run();
    } else {
      // 添加点赞
      await DB.prepare(`
        INSERT INTO rating_likes (rating_id, user_id)
        VALUES (?, ?)
      `).bind(ratingId, userId).run();
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to like review' }, 500);
  }
});

// 回复评价
reviews.post('/:id/reply', auth(), async (c) => {
  const { DB } = c.env;
  const ratingId = c.req.param('id');
  const userId = c.get('jwtPayload').id;
  const { content } = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO rating_replies (
        rating_id, user_id, content
      ) VALUES (?, ?, ?)
    `).bind(ratingId, userId, content).run();
    
    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to reply review' }, 500);
  }
});

export default reviews; 