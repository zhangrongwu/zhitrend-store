import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrashIcon } from '@heroicons/react/24/outline';
import Alert from '../components/Alert';
import { useState } from 'react';

interface FavoriteProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  favorited_at: string;
}

export default function Favorites() {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery<FavoriteProduct[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/favorites', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch favorites');
      return response.json();
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`http://localhost:8787/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to remove favorite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
      setAlert({ type: 'success', message: '已从收藏中移除' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '移除失败，请重试' });
    },
  });

  const handleRemove = async (productId: number) => {
    await removeFavoriteMutation.mutateAsync(productId);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Alert
        show={!!alert}
        type={alert?.type || 'success'}
        message={alert?.message || ''}
        onClose={() => setAlert(null)}
      />

      <h2 className="text-2xl font-bold mb-6">我的收藏</h2>

      {favorites?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">还没有收藏任何商品</p>
          <Link
            to="/products"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            去浏览商品 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites?.map((product) => (
            <div key={product.id} className="bg-white shadow rounded-lg overflow-hidden">
              <Link to={`/products/${product.id}`}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <div className="p-4">
                <Link to={`/products/${product.id}`}>
                  <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                </Link>
                <p className="mt-1 text-sm text-gray-500">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-medium text-gray-900">¥{product.price}</p>
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="text-red-600 hover:text-red-500"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  收藏于 {new Date(product.favorited_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 