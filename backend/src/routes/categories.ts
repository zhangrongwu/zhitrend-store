import { Hono } from 'hono';
import { adminAuth } from '../middleware/adminAuth';

const categories = new Hono();

// 获取所有分类
categories.get('/', async (c) => {
  const { DB } = c.env;
  
  try {
    const categories = await DB.prepare(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();
    
    return c.json(categories.results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// 创建分类
categories.post('/', adminAuth(), async (c) => {
  const { DB } = c.env;
  const { name, description } = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `).bind(name, description).run();
    
    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

// 更新分类
categories.put('/:id', adminAuth(), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const { name, description } = await c.req.json();
  
  try {
    await DB.prepare(`
      UPDATE categories 
      SET name = ?, description = ?
      WHERE id = ?
    `).bind(name, description, id).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

// 删除分类
categories.delete('/:id', adminAuth(), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    // 检查分类下是否有商品
    const products = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE category_id = ?
    `).bind(id).first();
    
    if (products.count > 0) {
      return c.json({ error: '该分类下还有商品，无法删除' }, 400);
    }
    
    await DB.prepare('DELETE FROM categories WHERE id = ?')
      .bind(id)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

export default categories; 