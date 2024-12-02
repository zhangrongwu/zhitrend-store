export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  regions: string[];
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface PaymentSession {
  id: string;
  url?: string;
  qrcode?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface CreatePaymentRequest {
  orderId: number;
  amount: number;
  currency: string;
  method: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentHookData {
  type: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, any>;
} 