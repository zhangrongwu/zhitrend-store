import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Alert from '../../components/Alert';
import { useState } from 'react';

interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  contact_phone: string;
  created_at: string;
  items: string;
}

const statusMap = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

export default function OrderManagement() {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/admin/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`http://localhost:8787/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['admin-orders'] 
      });
      setAlert({ type: 'success', message: '订单状态更新成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '更新失败，请重试。' });
    },
  });

  const handleStatusChange = async (orderId: number, status: string) => {
    await updateStatusMutation.mutateAsync({ orderId, status });
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

      <h2 className="text-2xl font-bold mb-6">订单管理</h2>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                订单号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                金额
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                收货信息
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders?.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {statusMap[order.status as keyof typeof statusMap]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ¥{order.total_amount}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>{order.shipping_address}</div>
                  <div>{order.contact_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.status === 'paid' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'shipped')}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      发货
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                      className="text-red-600 hover:text-red-900"
                    >
                      取消订单
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 