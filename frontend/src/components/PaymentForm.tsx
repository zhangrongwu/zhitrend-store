import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Alert from './Alert';

interface PaymentFormProps {
  orderId: number;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentForm({ orderId, amount, onClose, onSuccess }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('alipay');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const paymentMutation = useMutation({
    mutationFn: async (data: { orderId: number; paymentMethod: string }) => {
      const response = await fetch('http://localhost:8787/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: data.orderId,
          paymentMethod: data.paymentMethod,
        }),
      });
      if (!response.ok) throw new Error('Payment failed');
      return response.json();
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: '支付成功！' });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    },
    onError: () => {
      setAlert({ type: 'error', message: '支付失败，请重试。' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await paymentMutation.mutateAsync({ orderId, paymentMethod });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">支付订单</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">支付方式</label>
            <div className="mt-2 space-y-4">
              <div className="flex items-center">
                <input
                  id="alipay"
                  name="paymentMethod"
                  type="radio"
                  value="alipay"
                  checked={paymentMethod === 'alipay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="alipay" className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">支付宝</span>
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="wechat" className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">微信支付</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={paymentMutation.isPending}
            >
              {paymentMutation.isPending ? '处理中...' : '确认支付'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <p className="text-xs text-gray-500 text-center">
            支付即表示您同意我们的
            <a href="#" className="text-indigo-600 hover:text-indigo-500">服务条款</a>
            和
            <a href="#" className="text-indigo-600 hover:text-indigo-500">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
} 