import { Hono } from 'hono';
import { PAYMENT_CONFIG } from '../config/payment';
import Stripe from 'stripe';

const stripe = new Stripe(PAYMENT_CONFIG.stripe.secretKey);
const callbacks = new Hono();

// Stripe支付回调
callbacks.post('/stripe', async (c) => {
  const sig = c.req.header('stripe-signature');
  if (!sig) return c.json({ error: 'No signature' }, 400);

  try {
    const event = stripe.webhooks.constructEvent(
      await c.req.text(),
      sig,
      PAYMENT_CONFIG.stripe.webhookSecret
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(c, event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handleStripePaymentFailure(c, event.data.object);
        break;
    }

    return c.json({ received: true });
  } catch (err) {
    return c.json({ error: 'Webhook Error' }, 400);
  }
});

// PayPal支付回调
callbacks.post('/paypal', async (c) => {
  const { DB } = c.env;
  const { orderID, status } = await c.req.json();

  try {
    if (status === 'COMPLETED') {
      await DB.prepare(`
        UPDATE orders 
        SET status = 'paid', 
            payment_method = 'paypal',
            paid_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(orderID).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to process PayPal callback' }, 500);
  }
});

// 支付宝回调
callbacks.post('/alipay', async (c) => {
  const { DB } = c.env;
  const params = await c.req.json();

  try {
    // 验证支付宝回调签名
    if (!verifyAlipayCallback(params)) {
      return c.json({ error: 'Invalid signature' }, 400);
    }

    if (params.trade_status === 'TRADE_SUCCESS') {
      await DB.prepare(`
        UPDATE orders 
        SET status = 'paid',
            payment_method = 'alipay',
            paid_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(params.out_trade_no).run();
    }

    return c.text('success');
  } catch (error) {
    return c.json({ error: 'Failed to process Alipay callback' }, 500);
  }
});

// 微信支付回调
callbacks.post('/wechat', async (c) => {
  const { DB } = c.env;
  const xml = await c.req.text();

  try {
    // 验证微信支付回调签名
    const params = parseWechatXml(xml);
    if (!verifyWechatCallback(params)) {
      return c.json({ error: 'Invalid signature' }, 400);
    }

    if (params.result_code === 'SUCCESS') {
      await DB.prepare(`
        UPDATE orders 
        SET status = 'paid',
            payment_method = 'wechat',
            paid_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(params.out_trade_no).run();
    }

    return c.text('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
  } catch (error) {
    return c.json({ error: 'Failed to process WeChat callback' }, 500);
  }
});

async function handleStripePaymentSuccess(c: any, paymentIntent: any) {
  const { DB } = c.env;
  const orderId = paymentIntent.metadata.orderId;

  await DB.prepare(`
    UPDATE orders 
    SET status = 'paid',
        payment_method = 'stripe',
        paid_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(orderId).run();
}

async function handleStripePaymentFailure(c: any, paymentIntent: any) {
  const { DB } = c.env;
  const orderId = paymentIntent.metadata.orderId;

  await DB.prepare(`
    UPDATE orders 
    SET status = 'payment_failed',
        payment_error = ?
    WHERE id = ?
  `).bind(paymentIntent.last_payment_error?.message || 'Payment failed', orderId).run();
}

export default callbacks; 