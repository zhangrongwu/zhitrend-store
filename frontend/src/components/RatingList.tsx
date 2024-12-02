import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RatingStars from './RatingStars';
import { ThumbUpIcon } from '@heroicons/react/24/outline';
import { ThumbUpIcon as ThumbUpSolidIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

interface Rating {
  id: number;
  user_id: number;
  user_name: string;
  score: number;
  comment: string;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
  replies: {
    id: number;
    user_name: string;
    content: string;
    created_at: string;
  }[];
}

interface RatingListProps {
  productId: number;
}

export default function RatingList({ productId }: RatingListProps) {
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: ratings, isLoading } = useQuery<Rating[]>({
    queryKey: ['ratings', productId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8787/api/products/${productId}/ratings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch ratings');
      return response.json();
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (ratingId: number) => {
      const response = await fetch(`http://localhost:8787/api/ratings/${ratingId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to like rating');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ratings', productId]);
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ ratingId, content }: { ratingId: number; content: string }) => {
      const response = await fetch(`http://localhost:8787/api/ratings/${ratingId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to reply to rating');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ratings', productId]);
      setReplyContent('');
      setReplyingTo(null);
    },
  });

  const handleLike = async (ratingId: number) => {
    await likeMutation.mutateAsync(ratingId);
  };

  const handleReply = async (ratingId: number) => {
    if (!replyContent.trim()) return;
    await replyMutation.mutateAsync({ ratingId, content: replyContent });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      {ratings?.map((rating) => (
        <div key={rating.id} className="border-b border-gray-200 pb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center">
                <span className="font-medium mr-2">{rating.user_name}</span>
                <RatingStars rating={rating.score} size="sm" />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(rating.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleLike(rating.id)}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              {rating.is_liked ? (
                <ThumbUpSolidIcon className="h-5 w-5 text-indigo-600" />
              ) : (
                <ThumbUpIcon className="h-5 w-5" />
              )}
              <span className="ml-1">{rating.likes_count}</span>
            </button>
          </div>

          <p className="mt-4 text-gray-700">{rating.comment}</p>

          {/* 回复列表 */}
          {rating.replies.length > 0 && (
            <div className="mt-4 pl-6 space-y-4">
              {rating.replies.map((reply) => (
                <div key={reply.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <span className="font-medium text-sm">{reply.user_name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{reply.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* 回复表单 */}
          {replyingTo === rating.id ? (
            <div className="mt-4 pl-6">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                placeholder="写下你的回复..."
              />
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  取消
                </button>
                <button
                  onClick={() => handleReply(rating.id)}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  回复
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setReplyingTo(rating.id)}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700"
            >
              回复
            </button>
          )}
        </div>
      ))}
    </div>
  );
} 