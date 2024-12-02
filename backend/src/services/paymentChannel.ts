interface PaymentChannelConfig {
  id: string;
  name: string;
  type: 'stripe' | 'paypal' | 'alipay' | 'wechat';
  enabled: boolean;
  config: Record<string, any>;
  limits: {
    minAmount: number;
    maxAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  priority: number;
  regions: string[];
}

export class PaymentChannelService {
  static async getChannels(c: any): Promise<PaymentChannelConfig[]> {
    const { DB } = c.env;
    
    try {
      const channels = await DB.prepare(`
        SELECT * FROM payment_channels
        WHERE enabled = true
        ORDER BY priority DESC
      `).all();

      return channels.results.map((channel: any) => ({
        ...channel,
        config: JSON.parse(channel.config),
        limits: JSON.parse(channel.limits),
        regions: JSON.parse(channel.regions),
      }));
    } catch (error) {
      console.error('Failed to get payment channels:', error);
      throw error;
    }
  }

  static async updateChannel(c: any, channelId: string, data: Partial<PaymentChannelConfig>): Promise<void> {
    const { DB } = c.env;
    
    try {
      const updates = [];
      const values = [];
      
      if (data.name) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.enabled !== undefined) {
        updates.push('enabled = ?');
        values.push(data.enabled);
      }
      if (data.config) {
        updates.push('config = ?');
        values.push(JSON.stringify(data.config));
      }
      if (data.limits) {
        updates.push('limits = ?');
        values.push(JSON.stringify(data.limits));
      }
      if (data.priority !== undefined) {
        updates.push('priority = ?');
        values.push(data.priority);
      }
      if (data.regions) {
        updates.push('regions = ?');
        values.push(JSON.stringify(data.regions));
      }

      if (updates.length > 0) {
        await DB.prepare(`
          UPDATE payment_channels
          SET ${updates.join(', ')}, updated_at = datetime('now')
          WHERE id = ?
        `).bind(...values, channelId).run();
      }

      // 记录更新日志
      await DB.prepare(`
        INSERT INTO payment_channel_logs (
          channel_id,
          action,
          changes,
          created_at
        ) VALUES (?, 'update', ?, datetime('now'))
      `).bind(channelId, JSON.stringify(data)).run();
    } catch (error) {
      console.error('Failed to update payment channel:', error);
      throw error;
    }
  }

  static async getChannelStats(c: any, channelId: string, period: string): Promise<any> {
    const { DB } = c.env;
    
    try {
      const dateFilter = period === 'month' 
        ? "datetime('now', '-1 month')"
        : "datetime('now', '-1 day')";

      const stats = await DB.prepare(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
          SUM(amount) as total_amount,
          AVG(CASE WHEN status = 'completed' THEN processing_time ELSE NULL END) as avg_processing_time
        FROM payments
        WHERE channel_id = ?
        AND created_at >= ${dateFilter}
      `).bind(channelId).first();

      return stats;
    } catch (error) {
      console.error('Failed to get channel stats:', error);
      throw error;
    }
  }

  static async validateChannel(c: any, channelId: string, amount: number): Promise<boolean> {
    const { DB } = c.env;
    
    try {
      const channel = await DB.prepare(`
        SELECT * FROM payment_channels WHERE id = ?
      `).bind(channelId).first();

      if (!channel || !channel.enabled) {
        return false;
      }

      const limits = JSON.parse(channel.limits);

      // 检查金额限制
      if (amount < limits.minAmount || amount > limits.maxAmount) {
        return false;
      }

      // 检查日限额
      const dailyTotal = await DB.prepare(`
        SELECT SUM(amount) as total
        FROM payments
        WHERE channel_id = ?
        AND created_at >= datetime('now', '-1 day')
        AND status = 'completed'
      `).bind(channelId).first();

      if ((dailyTotal?.total || 0) + amount > limits.dailyLimit) {
        return false;
      }

      // 检查月限额
      const monthlyTotal = await DB.prepare(`
        SELECT SUM(amount) as total
        FROM payments
        WHERE channel_id = ?
        AND created_at >= datetime('now', '-1 month')
        AND status = 'completed'
      `).bind(channelId).first();

      if ((monthlyTotal?.total || 0) + amount > limits.monthlyLimit) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to validate payment channel:', error);
      return false;
    }
  }
} 