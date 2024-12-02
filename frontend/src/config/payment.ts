export const PAYMENT_CONFIG = {
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'your_stripe_publishable_key',
    currency: 'usd',
    locale: 'en',
  },
  paypal: {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'your_paypal_client_id',
    currency: 'USD',
  },
  exchangeRate: {
    CNY_USD: 0.14, // 1 CNY = 0.14 USD
  },
  supportedMethods: [
    {
      id: 'stripe',
      name: '信用卡支付',
      icon: '/images/payment/stripe.svg',
      regions: ['global'],
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '/images/payment/paypal.svg',
      regions: ['global'],
    },
    {
      id: 'alipay',
      name: '支付宝',
      icon: '/images/payment/alipay.svg',
      regions: ['CN'],
    },
    {
      id: 'wechat',
      name: '微信支付',
      icon: '/images/payment/wechat.svg',
      regions: ['CN'],
    },
  ],
}; 