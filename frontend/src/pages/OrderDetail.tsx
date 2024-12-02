import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import PaymentForm from '../components/PaymentForm';
import ReviewForm from '../components/ReviewForm';

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  contact_phone: string;
  created_at: string;
  items: OrderItem[];
}

const statusMap = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

export default function OrderDetail() {
  const { id } = useParams();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState<{ productId: number; orderId: number } | null>(null);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8787/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch order');
      return response.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  const renderActionButton = () => {
    switch (order.status) {
      case 'pending':
        return (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="mt-4 w-full rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            立即支付
          </button>
        );
      case 'paid':
        return (
          <div className="mt-4 text-sm text-gray-500 text-center">
            等待商家发货
          </div>
        );
      case 'shipped':
        return (
          <button
            onClick={() => handleConfirmReceipt()}
            className="mt-4 w-full rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700"
          >
            确认收货
          </button>
        );
      case 'completed':
        return order.items.map(item => (
          <button
            key={item.id}
            onClick={() => setShowReviewForm({ productId: item.product_id, orderId: order.id })}
            className="mt-4 w-full rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            评价商品
          </button>
        ));
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              订单详情
            </h3>
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              {statusMap[order.status as keyof typeof statusMap]}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            订单号：{order.id}
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">下单时间</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(order.created_at).toLocaleString()}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">收货地址</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.shipping_address}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">联系电话</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.contact_phone}
              </dd>
            </div>
          </dl>
        </div>
        
        <div className="px-4 py-5 sm:px-6">
          <h4 className="text-lg font-medium text-gray-900">商品清单</h4>
          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">数量：{item.quantity}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  ¥{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>总计</p>
              <p>¥{order.total_amount}</p>
            </div>
          </div>
        </div>
      </div>
      
      {renderActionButton()}

      {showPaymentForm && (
        <PaymentForm
          orderId={order.id}
          amount={order.total_amount}
          onClose={() => setShowPaymentForm(false)}
          onSuccess={() => {
            setShowPaymentForm(false);
            queryClient.invalidateQueries(['order', id]);
          }}
        />
      )}

      {showReviewForm && (
        <ReviewForm
          productId={showReviewForm.productId}
          orderId={showReviewForm.orderId}
          onClose={() => setShowReviewForm(null)}
          onSuccess={() => {
            setShowReviewForm(null);
            queryClient.invalidateQueries(['order', id]);
          }}
        />
      )}
    </div>
  );
} 