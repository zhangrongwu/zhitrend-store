import { Hono } from 'hono';
import { PAYMENT_CONFIG } from '../config/payment';

const stats = new Hono();

// 支付统计
stats.get('/stats', async (c) => {
  const { DB } = c.env;
  const { start_date, end_date } = c.req.query();

  try {
    // 支付方式统计
    const paymentMethodStats = await DB.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM payments
      WHERE status = 'completed'
      AND created_at BETWEEN ? AND ?
      GROUP BY payment_method
    `).bind(start_date, end_date).all();

    // 每日支付统计
    const dailyStats = await DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM payments
      WHERE status = 'completed'
      AND created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(start_date, end_date).all();

    // 支付成功率
    const successRate = await DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate
      FROM payments
      WHERE created_at BETWEEN ? AND ?
    `).bind(start_date, end_date).first();

    // 退款统计
    const refundStats = await DB.prepare(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM refunds
      WHERE status = 'succeeded'
      AND created_at BETWEEN ? AND ?
    `).bind(start_date, end_date).first();

    return c.json({
      paymentMethodStats: paymentMethodStats.results,
      dailyStats: dailyStats.results,
      successRate: successRate.success_rate,
      refundStats,
    });
  } catch (error) {
    console.error('Payment stats error:', error);
    return c.json({ error: 'Failed to get payment stats' }, 500);
  }
});

// 对账报表
stats.get('/reconciliation', async (c) => {
  const { DB } = c.env;
  const { date } = c.req.query();

  try {
    // 系统订单记录
    const systemOrders = await DB.prepare(`
      SELECT 
        o.id as order_id,
        o.total_amount,
        p.payment_id,
        p.amount as paid_amount,
        p.status as payment_status,
        p.created_at
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE DATE(o.created_at) = ?
    `).bind(date).all();

    // 支付平台交易记录
    const platformTransactions = await Promise.all([
      // Stripe对账
      stripeReconciliation(date),
      // PayPal对账
      paypalReconciliation(date),
      // 支付宝对账
      alipayReconciliation(date),
      // 微信支付对账
      wechatReconciliation(date),
    ]);

    // 对账差异
    const discrepancies = findDiscrepancies(
      systemOrders.results,
      platformTransactions
    );

    return c.json({
      systemOrders: systemOrders.results,
      platformTransactions,
      discrepancies,
    });
  } catch (error) {
    console.error('Reconciliation error:', error);
    return c.json({ error: 'Failed to generate reconciliation report' }, 500);
  }
});

// 各平台对账函数
async function stripeReconciliation(date: string) {
  const stripe = require('stripe')(PAYMENT_CONFIG.stripe.secretKey);
  const startTimestamp = new Date(date).getTime() / 1000;
  const endTimestamp = startTimestamp + 86400;

  const charges = await stripe.charges.list({
    created: {
      gte: startTimestamp,
      lt: endTimestamp,
    },
  });

  return charges.data.map((charge: any) => ({
    platform: 'stripe',
    transaction_id: charge.id,
    amount: charge.amount / 100,
    status: charge.status,
    created_at: new Date(charge.created * 1000),
  }));
}

// 其他支付平台的对账函数...

// 查找差异
function findDiscrepancies(systemOrders: any[], platformTransactions: any[]) {
  const discrepancies = [];

  // 检查金额不匹配
  for (const order of systemOrders) {
    const transaction = platformTransactions.find(
      t => t.transaction_id === order.payment_id
    );

    if (transaction && transaction.amount !== order.paid_amount) {
      discrepancies.push({
        type: 'amount_mismatch',
        order_id: order.order_id,
        system_amount: order.paid_amount,
        platform_amount: transaction.amount,
      });
    }
  }

  // 检查系统有记录但平台没有的订单
  const systemOnlyOrders = systemOrders.filter(order => 
    !platformTransactions.some(t => t.transaction_id === order.payment_id)
  );

  // 检查平台有记录但系统没有的交易
  const platformOnlyTransactions = platformTransactions.filter(transaction =>
    !systemOrders.some(order => order.payment_id === transaction.transaction_id)
  );

  return {
    amount_mismatches: discrepancies,
    system_only: systemOnlyOrders,
    platform_only: platformOnlyTransactions,
  };
}

export default stats; 