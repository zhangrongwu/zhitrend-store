interface Env {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
}

export type { Env }; 