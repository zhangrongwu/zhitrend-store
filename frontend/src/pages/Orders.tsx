import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

interface Order {
  id: number;
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

export default function Orders() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">我的订单</h1>
      
      <div className="mt-8 space-y-8">
        {orders?.map((order) => (
          <div key={order.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  订单号：{order.id}
                </h3>
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {statusMap[order.status as keyof typeof statusMap]}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                下单时间：{new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">商品清单</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.items}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">总金额</dt>
                  <dd className="mt-1 text-sm text-gray-900">¥{order.total_amount}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">收货地址</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.shipping_address}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">联系电话</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.contact_phone}</dd>
                </div>
              </dl>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link
                to={`/orders/${order.id}`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                查看详情 →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 