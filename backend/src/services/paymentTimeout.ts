export class PaymentTimeoutService {
  private static TIMEOUT_MINUTES = 15;

  static async handleTimeout(c: any, paymentId: string): Promise<void> {
    const { DB } = c.env;

    try {
      // 获取支付信息
      const payment = await DB.prepare(`
        SELECT * FROM payments WHERE id = ?
      `).bind(paymentId).first();

      if (!payment) {
        throw new Error('Payment not found');
      }

      // 检查是否超时
      const createdAt = new Date(payment.created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (diffMinutes > this.TIMEOUT_MINUTES && payment.status === 'pending') {
        // 更新支付状态为超时
        await DB.prepare(`
          UPDATE payments
          SET status = 'timeout',
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(paymentId).run();

        // 更新订单状态
        await DB.prepare(`
          UPDATE orders
          SET status = 'payment_timeout',
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(payment.order_id).run();

        // 记录超时事件
        await DB.prepare(`
          INSERT INTO payment_events (
            payment_id,
            type,
            data,
            created_at
          ) VALUES (?, 'timeout', ?, datetime('now'))
        `).bind(
          paymentId,
          JSON.stringify({ timeout_minutes: this.TIMEOUT_MINUTES })
        ).run();

        // 释放库存（如果有预留）
        await this.releaseInventory(c, payment.order_id);
      }
    } catch (error) {
      console.error('Payment timeout handling error:', error);
      throw error;
    }
  }

  private static async releaseInventory(c: any, orderId: number): Promise<void> {
    const { DB } = c.env;

    // 获取订单项目
    const orderItems = await DB.prepare(`
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = ?
    `).bind(orderId).all();

    // 恢复库存
    for (const item of orderItems.results) {
      await DB.prepare(`
        UPDATE inventory
        SET quantity = quantity + ?
        WHERE product_id = ?
      `).bind(item.quantity, item.product_id).run();

      // 记录库存变动
      await DB.prepare(`
        INSERT INTO inventory_logs (
          product_id,
          quantity_change,
          type,
          reason,
          created_at
        ) VALUES (?, ?, 'in', ?, datetime('now'))
      `).bind(
        item.product_id,
        item.quantity,
        'Payment timeout inventory release'
      ).run();
    }
  }
} 