import { PaymentSession } from '../types/payment';

export class PaymentRetryService {
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 2000; // 2秒

  static async retryPayment(
    orderId: number,
    paymentMethod: string,
    onSuccess: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    let retries = 0;

    const attemptPayment = async () => {
      try {
        const response = await fetch('http://localhost:8787/api/payments/retry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            orderId,
            paymentMethod,
            retryCount: retries,
          }),
        });

        if (!response.ok) {
          throw new Error('Payment retry failed');
        }

        const session: PaymentSession = await response.json();

        if (session.status === 'completed') {
          onSuccess();
          return;
        }

        if (session.status === 'failed') {
          if (retries < PaymentRetryService.MAX_RETRIES) {
            retries++;
            setTimeout(attemptPayment, PaymentRetryService.RETRY_DELAY);
          } else {
            onError(new Error('Maximum retry attempts reached'));
          }
          return;
        }

      } catch (error) {
        if (retries < PaymentRetryService.MAX_RETRIES) {
          retries++;
          setTimeout(attemptPayment, PaymentRetryService.RETRY_DELAY);
        } else {
          onError(error as Error);
        }
      }
    };

    attemptPayment();
  }

  static async getFailureReason(paymentId: string): Promise<string> {
    try {
      const response = await fetch(`http://localhost:8787/api/payments/${paymentId}/failure-reason`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to get failure reason');

      const result = await response.json();
      return result.reason;
    } catch (error) {
      console.error('Get failure reason error:', error);
      return '支付失败，请稍后重试';
    }
  }
} 