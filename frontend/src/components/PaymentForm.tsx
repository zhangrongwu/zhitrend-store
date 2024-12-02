import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Alert from './Alert';
import { loadStripe } from '@stripe/stripe-js';
import { PayPalButtons } from "@paypal/react-paypal-js";

const stripePromise = loadStripe('your_stripe_publishable_key');

interface PaymentFormProps {
  orderId: number;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentForm({ orderId, amount, onClose, onSuccess }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Stripe支付处理
  const handleStripePayment = async () => {
    const stripe = await stripePromise;
    if (!stripe) return;

    const response = await fetch('http://localhost:8787/api/payments/stripe/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        orderId,
        amount,
      }),
    });

    const session = await response.json();
    await stripe.redirectToCheckout({
      sessionId: session.id,
    });
  };

  // PayPal支付处理
  const createPayPalOrder = async () => {
    const response = await fetch('http://localhost:8787/api/payments/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        orderId,
        amount,
      }),
    });
    const order = await response.json();
    return order.id;
  };

  const onPayPalApprove = async (data: any) => {
    const response = await fetch('http://localhost:8787/api/payments/paypal/capture-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        orderId: data.orderID,
      }),
    });

    const orderData = await response.json();
    if (orderData.status === 'COMPLETED') {
      setAlert({ type: 'success', message: '支付成功！' });
      setTimeout(onSuccess, 1500);
    }
  };

  // 支付宝/微信支付处理
  const localPaymentMutation = useMutation({
    mutationFn: async (data: { orderId: number; paymentMethod: string }) => {
      const response = await fetch('http://localhost:8787/api/payments/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Payment failed');
      return response.json();
    },
    onSuccess: (data) => {
      // 对于支付宝/微信支付，返回支付链接或二维码
      if (data.qrcode) {
        window.open(data.qrcode);
      }
      setAlert({ type: 'success', message: '请在新窗口完成支付' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '支付失败，请重试。' });
    },
  });

  const handlePayment = async () => {
    switch (paymentMethod) {
      case 'stripe':
        await handleStripePayment();
        break;
      case 'alipay':
      case 'wechat':
        await localPaymentMutation.mutateAsync({ orderId, paymentMethod });
        break;
      // PayPal通过按钮直接处理
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">支付订单</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">关闭</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Alert
          show={!!alert}
          type={alert?.type || 'success'}
          message={alert?.message || ''}
          onClose={() => setAlert(null)}
        />

        <div className="mb-6">
          <p className="text-lg font-medium text-gray-900">支付金额</p>
          <p className="text-3xl font-bold text-gray-900">¥{amount}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">选择支付方式</label>
            <div className="mt-2 space-y-4">
              <div className="flex items-center">
                <input
                  id="stripe"
                  name="paymentMethod"
                  type="radio"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="stripe" className="ml-3 flex items-center">
                  <span className="block text-sm font-medium text-gray-700">信用卡支付</span>
                  <img src="/images/stripe.svg" alt="Stripe" className="h-6 ml-2" />
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="paypal"
                  name="paymentMethod"
                  type="radio"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="paypal" className="ml-3 flex items-center">
                  <span className="block text-sm font-medium text-gray-700">PayPal</span>
                  <img src="/images/paypal.svg" alt="PayPal" className="h-6 ml-2" />
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="alipay"
                  name="paymentMethod"
                  type="radio"
                  value="alipay"
                  checked={paymentMethod === 'alipay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="alipay" className="ml-3 flex items-center">
                  <span className="block text-sm font-medium text-gray-700">支付宝</span>
                  <img src="/images/alipay.svg" alt="Alipay" className="h-6 ml-2" />
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="wechat"
                  name="paymentMethod"
                  type="radio"
                  value="wechat"
                  checked={paymentMethod === 'wechat'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="wechat" className="ml-3 flex items-center">
                  <span className="block text-sm font-medium text-gray-700">微信支付</span>
                  <img src="/images/wechat.svg" alt="WeChat Pay" className="h-6 ml-2" />
                </label>
              </div>
            </div>
          </div>

          {paymentMethod === 'paypal' ? (
            <PayPalButtons
              createOrder={createPayPalOrder}
              onApprove={onPayPalApprove}
              style={{ layout: "horizontal" }}
            />
          ) : (
            <button
              onClick={handlePayment}
              disabled={localPaymentMutation.isPending}
              className="w-full py-3 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md font-medium"
            >
              {localPaymentMutation.isPending ? '处理中...' : '确认支付'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 