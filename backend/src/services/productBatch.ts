interface BatchUpdateData {
  ids: number[];
  data: {
    price?: number;
    category_id?: number;
    stock?: number;
  };
}

export class ProductBatchService {
  // 批量更新商品
  static async batchUpdate(c: any, { ids, data }: BatchUpdateData): Promise<void> {
    const { DB } = c.env;

    try {
      await DB.prepare('BEGIN TRANSACTION').run();

      // 构建更新SQL
      const updateFields: string[] = [];
      const params: any[] = [];

      if (data.price !== undefined) {
        updateFields.push('price = ?');
        params.push(data.price);
      }

      if (data.category_id !== undefined) {
        updateFields.push('category_id = ?');
        params.push(data.category_id);
      }

      if (updateFields.length > 0) {
        const sql = `
          UPDATE products 
          SET ${updateFields.join(', ')}
          WHERE id IN (${ids.join(',')})
        `;
        await DB.prepare(sql).bind(...params).run();
      }

      // 更新库存
      if (data.stock !== undefined) {
        await DB.prepare(`
          UPDATE inventory
          SET quantity = ?
          WHERE product_id IN (${ids.join(',')})
        `).bind(data.stock).run();
      }

      await DB.prepare('COMMIT').run();
    } catch (error) {
      await DB.prepare('ROLLBACK').run();
      throw error;
    }
  }

  // 批量删除商品
  static async batchDelete(c: any, ids: number[]): Promise<void> {
    const { DB } = c.env;

    try {
      await DB.prepare('BEGIN TRANSACTION').run();

      // 删除相关数据
      await DB.prepare(`
        DELETE FROM inventory WHERE product_id IN (${ids.join(',')})
      `).run();

      await DB.prepare(`
        DELETE FROM products WHERE id IN (${ids.join(',')})
      `).run();

      await DB.prepare('COMMIT').run();
    } catch (error) {
      await DB.prepare('ROLLBACK').run();
      throw error;
    }
  }

  // 批量上架/下架商品
  static async batchUpdateStatus(c: any, ids: number[], status: boolean): Promise<void> {
    const { DB } = c.env;

    try {
      await DB.prepare(`
        UPDATE products
        SET status = ?
        WHERE id IN (${ids.join(',')})
      `).bind(status).run();
    } catch (error) {
      console.error('Failed to update product status:', error);
      throw error;
    }
  }

  // 批量调整价格
  static async batchAdjustPrice(
    c: any,
    ids: number[],
    adjustment: { type: 'fixed' | 'percentage'; value: number }
  ): Promise<void> {
    const { DB } = c.env;

    try {
      await DB.prepare('BEGIN TRANSACTION').run();

      if (adjustment.type === 'fixed') {
        // 固定金额调整
        await DB.prepare(`
          UPDATE products
          SET price = price + ?
          WHERE id IN (${ids.join(',')})
        `).bind(adjustment.value).run();
      } else {
        // 百分比调整
        await DB.prepare(`
          UPDATE products
          SET price = price * (1 + ?)
          WHERE id IN (${ids.join(',')})
        `).bind(adjustment.value / 100).run();
      }

      await DB.prepare('COMMIT').run();
    } catch (error) {
      await DB.prepare('ROLLBACK').run();
      throw error;
    }
  }
} 