import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useCartStore } from '../stores';
import Alert from '../components/Alert';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const addToCart = useCartStore(state => state.addItem);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8787/api/products/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return response.json();
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8787/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          productId: product?.id,
          quantity,
        }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    },
    onSuccess: () => {
      if (product) {
        addToCart({ ...product, quantity });
        setAlert({ type: 'success', message: '已添加到购物车' });
      }
    },
    onError: () => {
      setAlert({ type: 'error', message: '添加失败，请重试' });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
        <div className="lg:max-w-lg lg:self-end">
          <div className="overflow-hidden rounded-lg">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="lg:max-w-lg lg:self-end">
          <div className="mt-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-4 text-gray-500">{product.description}</p>
          </div>

          <Alert
            show={!!alert}
            type={alert?.type || 'success'}
            message={alert?.message || ''}
            onClose={() => setAlert(null)}
          />

          <div className="mt-10 flex flex-col space-y-4">
            <p className="text-3xl tracking-tight text-gray-900">¥{product.price}</p>
            
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                数量
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <button
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending}
              className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {addToCartMutation.isPending ? '添加中...' : '加入购物车'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 