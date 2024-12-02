import { PaymentSession } from '../types/payment';

export class PaymentService {
  private static POLL_INTERVAL = 3000; // 3秒轮询一次
  private static MAX_ATTEMPTS = 40; // 最多轮询2分钟

  static async pollPaymentStatus(
    orderId: number,
    onSuccess: () => void,
    onError: () => void
  ): Promise<void> {
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`http://localhost:8787/api/payments/status/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch payment status');

        const session: PaymentSession = await response.json();

        if (session.status === 'completed') {
          onSuccess();
          return;
        }

        if (session.status === 'failed') {
          onError();
          return;
        }

        attempts++;
        if (attempts < PaymentService.MAX_ATTEMPTS) {
          setTimeout(poll, PaymentService.POLL_INTERVAL);
        } else {
          onError();
        }
      } catch (error) {
        console.error('Payment polling error:', error);
        onError();
      }
    };

    poll();
  }

  static async verifyPayment(paymentId: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:8787/api/payments/verify/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Payment verification failed');

      const result = await response.json();
      return result.verified;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }
} 