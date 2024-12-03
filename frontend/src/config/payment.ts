/// <reference types="vite/client" />

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export const paymentConfig = {
  stripe: {
    publishableKey: (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || 'your_stripe_publishable_key',
  },
  paypal: {
    clientId: (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || 'your_paypal_client_id',
  },
  supportedMethods: [
    {
      id: 'stripe',
      name: '信用卡支付',
      icon: 'stripe-icon',
      enabled: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: 'paypal-icon',
      enabled: true,
    },
    {
      id: 'alipay',
      name: '支付宝',
      icon: 'alipay-icon',
      enabled: true,
    },
    {
      id: 'wechat',
      name: '微信支付',
      icon: 'wechat-icon',
      enabled: true,
    },
  ] as PaymentMethod[],
}; 