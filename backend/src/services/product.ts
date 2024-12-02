import { Context } from 'hono';
import { Env } from '../types/env';

export async function getProducts(c: Context<{ Bindings: Env }>) {
  const { DB } = c.env;
  
  try {
    const products = await DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        COALESCE(i.quantity, 0) as stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.created_at DESC
    `).all();

    return products;
  } catch (error) {
    throw new Error('Failed to fetch products');
  }
}

export async function getProduct(c: Context<{ Bindings: Env }>, id: string) {
  const { DB } = c.env;
  
  try {
    const product = await DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        COALESCE(i.quantity, 0) as stock,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `).bind(id).first();

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  } catch (error) {
    throw new Error('Failed to fetch product');
  }
}

export async function createProduct(c: Context<{ Bindings: Env }>, data: any) {
  const { DB } = c.env;
  
  try {
    const result = await DB.prepare(`
      INSERT INTO products (
        name, description, price, image, category_id
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.description,
      data.price,
      data.image,
      data.category_id
    ).run();

    // 创建库存记录
    if (result.success) {
      await DB.prepare(`
        INSERT INTO inventory (product_id, quantity)
        VALUES (?, ?)
      `).bind(result.lastRowId, data.stock || 0).run();
    }

    return { id: result.lastRowId };
  } catch (error) {
    throw new Error('Failed to create product');
  }
}

export async function updateProduct(c: Context<{ Bindings: Env }>, id: string, data: any) {
  const { DB } = c.env;
  
  try {
    await DB.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, image = ?, category_id = ?
      WHERE id = ?
    `).bind(
      data.name,
      data.description,
      data.price,
      data.image,
      data.category_id,
      id
    ).run();

    // 更新库存
    if (data.stock !== undefined) {
      await DB.prepare(`
        UPDATE inventory 
        SET quantity = ?
        WHERE product_id = ?
      `).bind(data.stock, id).run();
    }

    return { success: true };
  } catch (error) {
    throw new Error('Failed to update product');
  }
} 