import { PAYMENT_CONFIG } from '../config/payment';
import { PaymentNotificationService } from './paymentNotification';

interface ReconciliationResult {
  date: string;
  platform: string;
  systemTotal: number;
  platformTotal: number;
  difference: number;
  discrepancies: {
    type: string;
    details: any;
  }[];
}

export class PaymentReconciliationService {
  static async reconcile(c: any, date: string): Promise<ReconciliationResult[]> {
    const { DB } = c.env;
    const results: ReconciliationResult[] = [];

    try {
      // 获取系统订单数据
      const systemOrders = await DB.prepare(`
        SELECT 
          o.id,
          o.total_amount,
          p.payment_id,
          p.amount as paid_amount,
          p.payment_method,
          p.status,
          p.created_at
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE DATE(o.created_at) = ?
      `).bind(date).all();

      // 获取各平台交易数据
      const platformTransactions = await this.fetchPlatformTransactions(date);

      // 对账处理
      for (const platform of Object.keys(platformTransactions)) {
        const platformData = platformTransactions[platform];
        const systemData = systemOrders.results.filter(
          order => order.payment_method === platform
        );

        const result = await this.reconcilePlatform(
          c,
          platform,
          date,
          systemData,
          platformData
        );

        results.push(result);
      }

      // 记录对账结果
      await this.saveReconciliationResults(c, results);

      // 如果有差异，发送通知
      const hasDiscrepancies = results.some(r => r.discrepancies.length > 0);
      if (hasDiscrepancies) {
        await PaymentNotificationService.notify(c, {
          type: 'error',
          orderId: 0,
          userId: 1, // 管理员ID
          message: '对账发现差异，请及时处理',
          metadata: { results },
        });
      }

      return results;
    } catch (error) {
      console.error('Reconciliation error:', error);
      throw error;
    }
  }

  private static async fetchPlatformTransactions(date: string): Promise<Record<string, any[]>> {
    const startTime = new Date(date);
    const endTime = new Date(date);
    endTime.setDate(endTime.getDate() + 1);

    return {
      stripe: await this.fetchStripeTransactions(startTime, endTime),
      paypal: await this.fetchPayPalTransactions(startTime, endTime),
      alipay: await this.fetchAlipayTransactions(date),
      wechat: await this.fetchWechatTransactions(date),
    };
  }

  private static async reconcilePlatform(
    c: any,
    platform: string,
    date: string,
    systemData: any[],
    platformData: any[]
  ): Promise<ReconciliationResult> {
    const systemTotal = systemData.reduce((sum, order) => sum + order.paid_amount, 0);
    const platformTotal = platformData.reduce((sum, tx) => sum + tx.amount, 0);

    const discrepancies = [];

    // 检查金额不匹配
    for (const order of systemData) {
      const tx = platformData.find(t => t.id === order.payment_id);
      if (tx && tx.amount !== order.paid_amount) {
        discrepancies.push({
          type: 'amount_mismatch',
          details: {
            orderId: order.id,
            paymentId: order.payment_id,
            systemAmount: order.paid_amount,
            platformAmount: tx.amount,
          },
        });
      }
    }

    // 检查系统有记录但平台没有的订单
    const systemOnly = systemData.filter(
      order => !platformData.some(tx => tx.id === order.payment_id)
    );
    if (systemOnly.length > 0) {
      discrepancies.push({
        type: 'system_only',
        details: systemOnly,
      });
    }

    // 检查平台有记录但系统没有的交易
    const platformOnly = platformData.filter(
      tx => !systemData.some(order => order.payment_id === tx.id)
    );
    if (platformOnly.length > 0) {
      discrepancies.push({
        type: 'platform_only',
        details: platformOnly,
      });
    }

    return {
      date,
      platform,
      systemTotal,
      platformTotal,
      difference: Math.abs(systemTotal - platformTotal),
      discrepancies,
    };
  }

  private static async saveReconciliationResults(
    c: any,
    results: ReconciliationResult[]
  ): Promise<void> {
    const { DB } = c.env;

    for (const result of results) {
      await DB.prepare(`
        INSERT INTO reconciliation_records (
          date,
          platform,
          system_total,
          platform_total,
          difference,
          discrepancies,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        result.date,
        result.platform,
        result.systemTotal,
        result.platformTotal,
        result.difference,
        JSON.stringify(result.discrepancies)
      ).run();
    }
  }

  // 各平台交易数据获取方法
  private static async fetchStripeTransactions(start: Date, end: Date): Promise<any[]> {
    const stripe = require('stripe')(PAYMENT_CONFIG.stripe.secretKey);
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(start.getTime() / 1000),
        lt: Math.floor(end.getTime() / 1000),
      },
    });
    return charges.data;
  }

  private static async fetchPayPalTransactions(start: Date, end: Date): Promise<any[]> {
    // 实现PayPal交易数据获取逻辑
    return [];
  }

  private static async fetchAlipayTransactions(date: string): Promise<any[]> {
    // 实现支付宝交易数据获取逻辑
    return [];
  }

  private static async fetchWechatTransactions(date: string): Promise<any[]> {
    // 实现微信支付交易数据获取逻辑
    return [];
  }
} 