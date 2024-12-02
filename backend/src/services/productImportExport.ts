import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

interface ProductImportData {
  name: string;
  description: string;
  price: number;
  image?: string;
  category_id?: number;
  stock?: number;
}

export class ProductImportExportService {
  // 导入商品
  static async importProducts(c: any, file: File): Promise<{ success: number; failed: number }> {
    const { DB } = c.env;
    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
    });

    let success = 0;
    let failed = 0;

    try {
      await DB.prepare('BEGIN TRANSACTION').run();

      for (const record of records) {
        try {
          // 验证数据
          if (!record.name || !record.price) {
            failed++;
            continue;
          }

          // 插入商品
          const result = await DB.prepare(`
            INSERT INTO products (
              name, description, price, image, category_id
            ) VALUES (?, ?, ?, ?, ?)
          `).bind(
            record.name,
            record.description || '',
            parseFloat(record.price),
            record.image || null,
            record.category_id || null
          ).run();

          // 创建库存记录
          if (result.lastRowId) {
            await DB.prepare(`
              INSERT INTO inventory (
                product_id, quantity, low_stock_threshold
              ) VALUES (?, ?, ?)
            `).bind(
              result.lastRowId,
              parseInt(record.stock) || 0,
              10
            ).run();
          }

          success++;
        } catch (error) {
          console.error('Failed to import product:', error);
          failed++;
        }
      }

      await DB.prepare('COMMIT').run();
      return { success, failed };
    } catch (error) {
      await DB.prepare('ROLLBACK').run();
      throw error;
    }
  }

  // 导出商品
  static async exportProducts(c: any): Promise<string> {
    const { DB } = c.env;

    try {
      const products = await DB.prepare(`
        SELECT 
          p.*,
          c.name as category_name,
          i.quantity as stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
      `).all();

      const csvString = stringify(products.results, {
        header: true,
        columns: [
          'id',
          'name',
          'description',
          'price',
          'image',
          'category_id',
          'category_name',
          'stock',
          'created_at'
        ]
      });

      return csvString;
    } catch (error) {
      console.error('Failed to export products:', error);
      throw error;
    }
  }
} 