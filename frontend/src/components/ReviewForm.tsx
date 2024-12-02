import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Alert from './Alert';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface ReviewFormProps {
  productId: number;
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewForm({ productId, orderId, onClose, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async (data: { productId: number; orderId: number; rating: number; content: string }) => {
      const response = await fetch('http://localhost:8787/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit review');
      return response.json();
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: '评价提交成功！' });
      setTimeout(() => {
        onSuccess();
      }, 2000);
    },
    onError: () => {
      setAlert({ type: 'error', message: '评价提交失败，请重试。' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await reviewMutation.mutateAsync({ productId, orderId, rating, content });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <Alert
          show={!!alert}
          type={alert?.type || 'success'}
          message={alert?.message || ''}
          onClose={() => setAlert(null)}
        />

        <h3 className="text-lg font-medium text-gray-900 mb-6">商品评价</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">评分</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="focus:outline-none"
                >
                  {value <= rating ? (
                    <StarIcon className="h-6 w-6 text-yellow-400" />
                  ) : (
                    <StarOutlineIcon className="h-6 w-6 text-gray-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">评价内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              提交评价
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 