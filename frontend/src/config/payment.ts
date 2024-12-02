interface ImportMetaEnv {
  VITE_STRIPE_PUBLISHABLE_KEY: string;
  VITE_PAYPAL_CLIENT_ID: string;
}

export const paymentConfig = {
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'your_stripe_publishable_key',
  },
  paypal: {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'your_paypal_client_id',
  },
}; 