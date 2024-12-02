export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface JWTPayload {
  id: number;
  email: string;
} 