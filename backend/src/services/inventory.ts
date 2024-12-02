interface StockAdjustment {
  productId: number;
  quantity: number;
  type: 'in' | 'out' | 'adjust';
  reason: string;
}

export class InventoryService {
  static async adjustStock(c: any, adjustment: StockAdjustment): Promise<void> {
    const { DB } = c.env;
    const { productId, quantity, type, reason } = adjustment;
    
    try {
      await DB.prepare('BEGIN TRANSACTION').run();
      
      try {
        // 更新库存
        if (type === 'in' || type === 'adjust') {
          await DB.prepare(`
            UPDATE inventory 
            SET quantity = quantity + ?
            WHERE product_id = ?
          `).bind(quantity, productId).run();
        } else {
          // 检查库存是否足够
          const currentStock = await DB.prepare(`
            SELECT quantity 
            FROM inventory 
            WHERE product_id = ?
          `).bind(productId).first();
          
          if (!currentStock || currentStock.quantity < quantity) {
            throw new Error('Insufficient stock');
          }
          
          await DB.prepare(`
            UPDATE inventory 
            SET quantity = quantity - ?
            WHERE product_id = ?
          `).bind(quantity, productId).run();
        }
        
        // 记录库存变动
        await DB.prepare(`
          INSERT INTO inventory_logs (
            product_id,
            quantity_change,
            type,
            reason,
            created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
          productId,
          quantity,
          type,
          reason
        ).run();
        
        await DB.prepare('COMMIT').run();
      } catch (error) {
        await DB.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      throw error;
    }
  }

  static async checkLowStock(c: any): Promise<any[]> {
    const { DB } = c.env;
    
    try {
      const lowStock = await DB.prepare(`
        SELECT 
          p.id,
          p.name,
          i.quantity,
          i.low_stock_threshold
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.quantity <= i.low_stock_threshold
      `).all();
      
      return lowStock.results;
    } catch (error) {
      console.error('Failed to check low stock:', error);
      throw error;
    }
  }

  static async getStockHistory(c: any, productId: number): Promise<any[]> {
    const { DB } = c.env;
    
    try {
      const history = await DB.prepare(`
        SELECT *
        FROM inventory_logs
        WHERE product_id = ?
        ORDER BY created_at DESC
        LIMIT 100
      `).bind(productId).all();
      
      return history.results;
    } catch (error) {
      console.error('Failed to get stock history:', error);
      throw error;
    }
  }
} 