import { Hono } from 'hono';
import Stripe from 'stripe';
import { PayPalClient } from '@paypal/checkout-server-sdk';

const stripe = new Stripe('your_stripe_secret_key');
const paypal = new PayPalClient({
  clientId: 'your_paypal_client_id',
  clientSecret: 'your_paypal_secret'
});

const payments = new Hono();

// Stripe支付
payments.post('/stripe/create-session', async (c) => {
  const { orderId, amount } = await c.req.json();
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Order #${orderId}`,
        },
        unit_amount: amount * 100, // Stripe使用分为单位
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${c.req.headers.get('origin')}/orders/${orderId}?payment=success`,
    cancel_url: `${c.req.headers.get('origin')}/orders/${orderId}?payment=cancelled`,
  });

  return c.json({ id: session.id });
});

// PayPal支付
payments.post('/paypal/create-order', async (c) => {
  const { orderId, amount } = await c.req.json();

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount.toString()
      },
      reference_id: orderId.toString()
    }]
  });

  const order = await paypal.execute(request);
  return c.json({ id: order.result.id });
});

payments.post('/paypal/capture-order', async (c) => {
  const { orderId } = await c.req.json();

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  const capture = await paypal.execute(request);
  
  return c.json(capture.result);
});

export default payments; 