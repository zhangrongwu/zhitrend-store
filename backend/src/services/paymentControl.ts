interface PaymentLimits {
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
}

interface RiskRule {
  id: string;
  name: string;
  condition: (payment: any) => boolean;
  action: 'block' | 'flag' | 'require_verification';
}

export class PaymentControlService {
  private static limits: PaymentLimits = {
    minAmount: 0.01,
    maxAmount: 50000,
    dailyLimit: 100000,
    monthlyLimit: 1000000,
  };

  private static riskRules: RiskRule[] = [
    {
      id: 'multiple_cards',
      name: '多卡支付',
      condition: (payment) => payment.cardCount > 3,
      action: 'require_verification',
    },
    {
      id: 'large_amount',
      name: '大额支付',
      condition: (payment) => payment.amount > 10000,
      action: 'require_verification',
    },
    {
      id: 'frequent_payments',
      name: '频繁支付',
      condition: (payment) => payment.frequency > 10,
      action: 'flag',
    },
    {
      id: 'unusual_location',
      name: '异常地区',
      condition: (payment) => payment.isUnusualLocation,
      action: 'block',
    },
  ];

  static async validatePayment(c: any, payment: any): Promise<{ valid: boolean; message?: string }> {
    const { DB } = c.env;
    const userId = c.get('jwtPayload').id;

    try {
      // 检查支付金额限制
      if (payment.amount < this.limits.minAmount) {
        return { valid: false, message: '支付金额不能小于最低限额' };
      }
      if (payment.amount > this.limits.maxAmount) {
        return { valid: false, message: '支付金额超过最高限额' };
      }

      // 检查日限额
      const dailyTotal = await DB.prepare(`
        SELECT SUM(amount) as total
        FROM payments
        WHERE user_id = ?
        AND created_at >= datetime('now', '-1 day')
      `).bind(userId).first();

      if ((dailyTotal?.total || 0) + payment.amount > this.limits.dailyLimit) {
        return { valid: false, message: '超过每日支付限额' };
      }

      // 检查月限额
      const monthlyTotal = await DB.prepare(`
        SELECT SUM(amount) as total
        FROM payments
        WHERE user_id = ?
        AND created_at >= datetime('now', '-1 month')
      `).bind(userId).first();

      if ((monthlyTotal?.total || 0) + payment.amount > this.limits.monthlyLimit) {
        return { valid: false, message: '超过每月支付限额' };
      }

      // 风控规则检查
      for (const rule of this.riskRules) {
        if (rule.condition(payment)) {
          await this.logRiskEvent(c, {
            userId,
            paymentId: payment.id,
            ruleId: rule.id,
            action: rule.action,
          });

          if (rule.action === 'block') {
            return { valid: false, message: '支付被风控系统拦截' };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Payment validation error:', error);
      return { valid: false, message: '支付验证失败' };
    }
  }

  private static async logRiskEvent(c: any, event: any) {
    const { DB } = c.env;
    await DB.prepare(`
      INSERT INTO risk_events (
        user_id,
        payment_id,
        rule_id,
        action,
        created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      event.userId,
      event.paymentId,
      event.ruleId,
      event.action
    ).run();
  }
} 