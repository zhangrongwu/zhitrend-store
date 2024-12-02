interface BatchCategoryUpdate {
  ids: number[];
  data: {
    name?: string;
    description?: string;
  };
}

export class CategoryBatchService {
  // 批量更新分类
  static async batchUpdate(c: any, { ids, data }: BatchCategoryUpdate): Promise<void> {
    const { DB } = c.env;

    try {
      await DB.prepare('BEGIN TRANSACTION').run();

      const updateFields: string[] = [];
      const params: any[] = [];

      if (data.name !== undefined) {
        updateFields.push('name = ?');
        params.push(data.name);
      }

      if (data.description !== undefined) {
        updateFields.push('description = ?');
        params.push(data.description);
      }

      if (updateFields.length > 0) {
        const sql = `
          UPDATE categories 
          SET ${updateFields.join(', ')}
          WHERE id IN (${ids.join(',')})
        `;
        await DB.prepare(sql).bind(...params).run();
      }

      await DB.prepare('COMMIT').run();
    } catch (error) {
      await DB.prepare('ROLLBACK').run();
      throw error;
    }
  }

  // 批量删除分类
  static async batchDelete(c: any, ids: number[]): Promise<void> {
    const { DB } = c.env;

    try {
      await DB.prepare('BEGIN TRANSACTION').run();

      // 检查是否有商品使用这些分类
      const products = await DB.prepare(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE category_id IN (${ids.join(',')})
      `).first();

      if (products.count > 0) {
        throw new Error('无法删除：有商品正在使用这些分类');
      }

      // 删除分类
      await DB.prepare(`
        DELETE FROM categories 
        WHERE id IN (${ids.join(',')})
      `).run();

      await DB.prepare('COMMIT').run();
    } catch (error) {
      await DB.prepare('ROLLBACK').run();
      throw error;
    }
  }

  // 批量移动商品到其他分类
  static async batchMoveProducts(
    c: any,
    { fromCategoryId, toCategoryId, productIds }: { 
      fromCategoryId: number;
      toCategoryId: number;
      productIds?: number[];
    }
  ): Promise<void> {
    const { DB } = c.env;

    try {
      await DB.prepare('BEGIN TRANSACTION').run();

      const sql = productIds 
        ? `
          UPDATE products 
          SET category_id = ? 
          WHERE category_id = ? 
          AND id IN (${productIds.join(',')})
        `
        : `
          UPDATE products 
          SET category_id = ? 
          WHERE category_id = ?
        `;

      await DB.prepare(sql)
        .bind(toCategoryId, fromCategoryId)
        .run();

      await DB.prepare('COMMIT').run();
    } catch (error) {
      await DB.prepare('ROLLBACK').run();
      throw error;
    }
  }
} 