export const PAYMENT_CONFIG = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'your_stripe_secret_key',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: 'usd',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: 'sandbox', // or 'live'
  },
  alipay: {
    appId: process.env.ALIPAY_APP_ID,
    privateKey: process.env.ALIPAY_PRIVATE_KEY,
    publicKey: process.env.ALIPAY_PUBLIC_KEY,
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    mchId: process.env.WECHAT_MCH_ID,
    apiKey: process.env.WECHAT_API_KEY,
  },
  exchangeRate: {
    provider: 'exchangerate-api',
    apiKey: process.env.EXCHANGE_RATE_API_KEY,
  },
};

export const PAYMENT_HOOKS = {
  stripe: '/api/webhooks/stripe',
  paypal: '/api/webhooks/paypal',
  alipay: '/api/webhooks/alipay',
  wechat: '/api/webhooks/wechat',
}; 