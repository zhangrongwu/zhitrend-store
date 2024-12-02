import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrashIcon } from '@heroicons/react/24/outline';
import Alert from '../components/Alert';
import { useState } from 'react';
import CheckoutForm from '../components/CheckoutForm';
import { Link } from 'react-router-dom';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  image: string;
}

export default function Cart() {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const { data: cartItems, isLoading } = useQuery<CartItem[]>({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/cart', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await fetch(`http://localhost:8787/api/cart/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error('Failed to update quantity');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['cartCount']);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:8787/api/cart/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to remove item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['cartCount']);
      setAlert({ type: 'success', message: '商品已从购物车中移除' });
    },
  });

  const handleQuantityChange = async (id: number, quantity: number) => {
    if (quantity < 1) return;
    try {
      await updateQuantityMutation.mutateAsync({ id, quantity });
    } catch (error) {
      setAlert({ type: 'error', message: '更新数量失败，请重试' });
    }
  };

  const handleRemoveItem = async (id: number) => {
    if (window.confirm('确定要从购物车中移除此商品吗？')) {
      try {
        await removeItemMutation.mutateAsync(id);
      } catch (error) {
        setAlert({ type: 'error', message: '移除商品失败，请重试' });
      }
    }
  };

  const total = cartItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          购物车
        </h1>

        <Alert
          show={!!alert}
          type={alert?.type || 'success'}
          message={alert?.message || ''}
          onClose={() => setAlert(null)}
        />

        {cartItems?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">购物车是空的</p>
            <Link
              to="/products"
              className="text-indigo-600 hover:text-indigo-500"
            >
              继续购物
            </Link>
          </div>
        ) : (
          <div className="mt-12">
            <div>
              <ul role="list" className="divide-y divide-gray-200 border-t border-b border-gray-200">
                {cartItems?.map((item) => (
                  <li key={item.id} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-24 rounded-lg object-cover object-center sm:h-32 sm:w-32"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col sm:ml-6">
                      <div>
                        <div className="flex justify-between">
                          <h4 className="text-sm">
                            <Link
                              to={`/products/${item.product_id}`}
                              className="font-medium text-gray-700 hover:text-gray-800"
                            >
                              {item.name}
                            </Link>
                          </h4>
                          <p className="ml-4 text-sm font-medium text-gray-900">
                            ¥{item.price * item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-1 items-end justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="text-gray-500">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>总计</p>
                <p>¥{total}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">运费和税费将在结算时计算。</p>

              <div className="mt-6">
                <button
                  onClick={() => setShowCheckoutForm(true)}
                  className="w-full rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  结算
                </button>
              </div>

              <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                <p>
                  或{' '}
                  <Link
                    to="/products"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    继续购物
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {showCheckoutForm && (
          <CheckoutForm
            onClose={() => setShowCheckoutForm(false)}
            onSuccess={() => {
              setShowCheckoutForm(false);
              queryClient.invalidateQueries(['cart']);
              queryClient.invalidateQueries(['cartCount']);
            }}
          />
        )}
      </div>
    </div>
  );
} 