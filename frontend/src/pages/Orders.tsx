import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const statusMap = {
  pending: { text: '待付款', color: 'bg-yellow-100 text-yellow-800' },
  paid: { text: '已付款', color: 'bg-blue-100 text-blue-800' },
  shipped: { text: '已发货', color: 'bg-purple-100 text-purple-800' },
  completed: { text: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { text: '已取消', color: 'bg-gray-100 text-gray-800' },
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
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">我的订单</h1>

        <div className="mt-8">
          {orders?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">暂无订单</p>
              <Link
                to="/products"
                className="text-indigo-600 hover:text-indigo-500"
              >
                去购物
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {orders?.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">
                          订单号：{order.id}
                        </h2>
                        <p className="text-sm text-gray-500">
                          下单时间：{format(new Date(order.created_at), 'PPpp', { locale: zhCN })}
                        </p>
                      </div>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusMap[order.status as keyof typeof statusMap].color
                        }`}
                      >
                        {statusMap[order.status as keyof typeof statusMap].text}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center py-2"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              数量：{item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            ¥{item.price * item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>总计</p>
                        <p>¥{order.total_amount}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        查看详情
                      </Link>
                      {order.status === 'pending' && (
                        <Link
                          to={`/orders/${order.id}/pay`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          去支付
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 