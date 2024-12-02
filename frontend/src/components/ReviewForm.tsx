import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Alert from './Alert';
import RatingStars from './RatingStars';

interface ReviewFormProps {
  productId: number;
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewForm({ productId, orderId, onClose, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      const response = await fetch(`http://localhost:8787/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...data,
          orderId,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit review');
      return response.json();
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: '评价提交成功！' });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    },
    onError: () => {
      setAlert({ type: 'error', message: '评价提交失败，请重试。' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setAlert({ type: 'error', message: '请填写评价内容' });
      return;
    }
    await reviewMutation.mutateAsync({ rating, comment });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">商品评价</h2>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">评分</label>
            <div className="mt-2">
              <RatingStars
                rating={rating}
                onChange={setRating}
                editable
                size="lg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              评价内容
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="请分享您的使用体验..."
            />
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
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? '提交中...' : '提交评价'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 