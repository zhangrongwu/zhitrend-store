import { Hono } from 'hono';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const products = new Hono();

// 获取商品列表
products.get('/', async (c) => {
  const { DB } = c.env;
  const { featured } = c.req.query();
  
  try {
    let query = 'SELECT * FROM products';
    if (featured) {
      query += ' WHERE featured = true';
    }
    query += ' ORDER BY created_at DESC';
    
    const products = await DB.prepare(query).all();
    return c.json(products.results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// 获取单个商品
products.get('/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const product = await DB.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).bind(id).first();
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    return c.json(product);
  } catch (error) {
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// 创建商品 (需要管理员权限)
products.post('/', adminAuth(), async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO products (
        name, 
        description, 
        price, 
        image,
        category_id
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.description,
      data.price,
      data.image,
      data.categoryId
    ).run();
    
    // 创建库存记录
    await DB.prepare(`
      INSERT INTO inventory (
        product_id,
        quantity,
        low_stock_threshold
      ) VALUES (?, ?, ?)
    `).bind(
      result.lastRowId,
      data.initialStock || 0,
      data.lowStockThreshold || 10
    ).run();
    
    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

// 更新商品 (需要管理员权限)
products.put('/:id', adminAuth(), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const data = await c.req.json();
  
  try {
    await DB.prepare(`
      UPDATE products 
      SET name = ?,
          description = ?,
          price = ?,
          image = ?,
          category_id = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name,
      data.description,
      data.price,
      data.image,
      data.categoryId,
      id
    ).run();
    
    // 更新库存
    if (data.hasOwnProperty('stock')) {
      await DB.prepare(`
        UPDATE inventory
        SET quantity = ?,
            low_stock_threshold = ?
        WHERE product_id = ?
      `).bind(
        data.stock,
        data.lowStockThreshold,
        id
      ).run();
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

// 删除商品 (需要管理员权限)
products.delete('/:id', adminAuth(), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    // 检查是否有相关订单
    const orders = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM order_items 
      WHERE product_id = ?
    `).bind(id).first();
    
    if (orders.count > 0) {
      return c.json({ error: '该商品已有订单，无法删除' }, 400);
    }
    
    // 开始事务
    await DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      // 删除库存记录
      await DB.prepare('DELETE FROM inventory WHERE product_id = ?').bind(id).run();
      
      // 删除商品
      await DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
      
      await DB.prepare('COMMIT').run();
      return c.json({ success: true });
    } catch (error) {
      await DB.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// 批量导入商品 (需要管理员权限)
products.post('/batch', adminAuth(), async (c) => {
  const { DB } = c.env;
  const products = await c.req.json();
  
  try {
    await DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      for (const product of products) {
        // 插入商品
        const result = await DB.prepare(`
          INSERT INTO products (
            name, description, price, image, category_id
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(
          product.name,
          product.description,
          product.price,
          product.image,
          product.categoryId
        ).run();
        
        // 创建库存记录
        await DB.prepare(`
          INSERT INTO inventory (
            product_id, quantity, low_stock_threshold
          ) VALUES (?, ?, ?)
        `).bind(
          result.lastRowId,
          product.initialStock || 0,
          product.lowStockThreshold || 10
        ).run();
      }
      
      await DB.prepare('COMMIT').run();
      return c.json({ success: true });
    } catch (error) {
      await DB.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    return c.json({ error: 'Failed to import products' }, 500);
  }
});

export default products; 