import { Hono } from 'hono';
import { PAYMENT_CONFIG } from '../config/payment';
import Stripe from 'stripe';

const stripe = new Stripe(PAYMENT_CONFIG.stripe.secretKey);
const refunds = new Hono();

// 申请退款
refunds.post('/', async (c) => {
  const { DB } = c.env;
  const { orderId, reason } = await c.req.json();

  try {
    // 获取订单信息
    const order = await DB.prepare(
      'SELECT * FROM orders WHERE id = ?'
    ).bind(orderId).first();

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // 检查订单状态
    if (!['paid', 'shipped'].includes(order.status)) {
      return c.json({ error: 'Order cannot be refunded' }, 400);
    }

    // 根据支付方式处理退款
    let refundResult;
    switch (order.payment_method) {
      case 'stripe':
        refundResult = await stripe.refunds.create({
          payment_intent: order.payment_id,
        });
        break;
      case 'paypal':
        // 调用PayPal退款API
        break;
      case 'alipay':
        // 调用支付宝退款API
        break;
      case 'wechat':
        // 调用微信退款API
        break;
    }

    // 记录退款信息
    await DB.prepare(`
      INSERT INTO refunds (
        order_id, 
        amount, 
        reason, 
        status,
        refund_id
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      orderId,
      order.total_amount,
      reason,
      'pending',
      refundResult?.id
    ).run();

    // 更新订单状态
    await DB.prepare(`
      UPDATE orders 
      SET status = 'refunding',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(orderId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Refund error:', error);
    return c.json({ error: 'Failed to process refund' }, 500);
  }
});

// 退款状态查询
refunds.get('/:id/status', async (c) => {
  const { DB } = c.env;
  const refundId = c.req.param('id');

  try {
    const refund = await DB.prepare(
      'SELECT * FROM refunds WHERE id = ?'
    ).bind(refundId).first();

    if (!refund) {
      return c.json({ error: 'Refund not found' }, 404);
    }

    // 根据支付方式查询退款状态
    let refundStatus;
    switch (refund.payment_method) {
      case 'stripe':
        const stripeRefund = await stripe.refunds.retrieve(refund.refund_id);
        refundStatus = stripeRefund.status;
        break;
      // 其他支付方式的退款状态查询
    }

    // 更新退款状态
    if (refundStatus && refundStatus !== refund.status) {
      await DB.prepare(`
        UPDATE refunds 
        SET status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(refundStatus, refundId).run();

      // 如果退款成功，更新订单状态
      if (refundStatus === 'succeeded') {
        await DB.prepare(`
          UPDATE orders 
          SET status = 'refunded',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(refund.order_id).run();
      }
    }

    return c.json({ status: refundStatus });
  } catch (error) {
    console.error('Refund status check error:', error);
    return c.json({ error: 'Failed to check refund status' }, 500);
  }
});

export default refunds; 