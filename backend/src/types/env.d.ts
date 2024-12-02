interface Env {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
}

export type { Env }; 