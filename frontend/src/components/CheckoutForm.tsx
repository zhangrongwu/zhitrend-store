import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Alert from './Alert';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface CheckoutFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const checkoutSchema = z.object({
  shippingAddress: z.string().min(5, '请输入详细的收货地址'),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号码'),
  contactName: z.string().min(2, '请输入收货人姓名'),
  note: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutForm({ onClose, onSuccess }: CheckoutFormProps) {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const response = await fetch('http://localhost:8787/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '订单创建失败');
      }
      return response.json();
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: '订单创建成功！' });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    },
    onError: (error) => {
      setAlert({ 
        type: 'error', 
        message: error instanceof Error ? error.message : '订单创建失败，请重试。' 
      });
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      await createOrderMutation.mutateAsync(data);
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">填写收货信息</h2>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
              收货人姓名
            </label>
            <input
              type="text"
              id="contactName"
              {...register('contactName')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.contactName && (
              <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
              联系电话
            </label>
            <input
              type="tel"
              id="contactPhone"
              {...register('contactPhone')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.contactPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">
              收货地址
            </label>
            <textarea
              id="shippingAddress"
              {...register('shippingAddress')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.shippingAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">
              订单备注
            </label>
            <textarea
              id="note"
              {...register('note')}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="选填"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : '提交订单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 