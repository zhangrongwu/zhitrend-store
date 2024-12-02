interface ScheduledTask {
  id: number;
  type: 'product_status' | 'price_update' | 'inventory_check';
  data: any;
  schedule: string; // cron 表达式
  status: 'pending' | 'running' | 'completed' | 'failed';
  last_run?: string;
  next_run: string;
}

export class ScheduledTaskService {
  // 创建定时任务
  static async createTask(c: any, task: Omit<ScheduledTask, 'id' | 'status'>): Promise<number> {
    const { DB } = c.env;

    try {
      const result = await DB.prepare(`
        INSERT INTO scheduled_tasks (
          type, data, schedule, status, next_run
        ) VALUES (?, ?, ?, 'pending', ?)
      `).bind(
        task.type,
        JSON.stringify(task.data),
        task.schedule,
        task.next_run
      ).run();

      return result.lastRowId;
    } catch (error) {
      console.error('Failed to create scheduled task:', error);
      throw error;
    }
  }

  // 执行定时任务
  static async executeTasks(c: any): Promise<void> {
    const { DB } = c.env;
    const now = new Date().toISOString();

    try {
      // 获取待执行的任务
      const tasks = await DB.prepare(`
        SELECT * FROM scheduled_tasks
        WHERE status = 'pending'
        AND next_run <= ?
      `).bind(now).all();

      for (const task of tasks.results) {
        try {
          // 更新任务状态为运行中
          await DB.prepare(`
            UPDATE scheduled_tasks
            SET status = 'running'
            WHERE id = ?
          `).bind(task.id).run();

          // 根据任务类型执行不同的操作
          switch (task.type) {
            case 'product_status':
              await this.executeProductStatusTask(c, task);
              break;
            case 'price_update':
              await this.executePriceUpdateTask(c, task);
              break;
            case 'inventory_check':
              await this.executeInventoryCheckTask(c, task);
              break;
          }

          // 更新任务状态和下次执行时间
          await DB.prepare(`
            UPDATE scheduled_tasks
            SET 
              status = 'completed',
              last_run = ?,
              next_run = ?
            WHERE id = ?
          `).bind(
            now,
            this.calculateNextRun(task.schedule),
            task.id
          ).run();
        } catch (error) {
          // 任务执行失败
          await DB.prepare(`
            UPDATE scheduled_tasks
            SET 
              status = 'failed',
              last_run = ?
            WHERE id = ?
          `).bind(now, task.id).run();

          console.error(`Task ${task.id} failed:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to execute scheduled tasks:', error);
      throw error;
    }
  }

  // 执行商品状态更新任务
  private static async executeProductStatusTask(c: any, task: ScheduledTask): Promise<void> {
    const { DB } = c.env;
    const { productIds, status } = task.data;

    await DB.prepare(`
      UPDATE products
      SET status = ?
      WHERE id IN (${productIds.join(',')})
    `).bind(status).run();
  }

  // 执行价格更新任务
  private static async executePriceUpdateTask(c: any, task: ScheduledTask): Promise<void> {
    const { DB } = c.env;
    const { updates } = task.data;

    for (const update of updates) {
      await DB.prepare(`
        UPDATE products
        SET price = ?
        WHERE id = ?
      `).bind(update.price, update.productId).run();
    }
  }

  // 执行库存检查任务
  private static async executeInventoryCheckTask(c: any, task: ScheduledTask): Promise<void> {
    const { DB } = c.env;
    const { threshold } = task.data;

    const lowStock = await DB.prepare(`
      SELECT 
        p.id,
        p.name,
        i.quantity
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.quantity <= ?
    `).bind(threshold).all();

    // 发送低库存通知
    if (lowStock.results.length > 0) {
      await DB.prepare(`
        INSERT INTO notifications (
          type, data, created_at
        ) VALUES (?, ?, datetime('now'))
      `).bind(
        'low_stock_alert',
        JSON.stringify(lowStock.results)
      ).run();
    }
  }

  // 计算下次执行时间
  private static calculateNextRun(schedule: string): string {
    // 这里需要实现 cron 表达式解析
    // 可以使用第三方库如 cron-parser
    // 简单示例：每天同一时间
    const next = new Date();
    next.setDate(next.getDate() + 1);
    return next.toISOString();
  }
} 