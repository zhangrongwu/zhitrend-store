import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Alert from '../../components/Alert';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Campaign {
  id: number;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  min_purchase: number;
  usage_limit: number;
  used_count: number;
}

interface AutomationRule {
  id: number;
  name: string;
  trigger_type: string;
  status: string;
}

export default function MarketingManagement() {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  // 获取营销活动列表
  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/admin/campaigns', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  // 获取优惠券列表
  const { data: coupons } = useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/admin/coupons', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch coupons');
      return response.json();
    },
  });

  // 获取自动化规则列表
  const { data: rules } = useQuery<AutomationRule[]>({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/admin/automation-rules', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch automation rules');
      return response.json();
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Alert
        show={!!alert}
        type={alert?.type || 'success'}
        message={alert?.message || ''}
        onClose={() => setAlert(null)}
      />

      {/* 营销活动 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">营销活动</h2>
          <button className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            创建活动
          </button>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  活动名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  开始时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  结束时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns?.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(campaign.start_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(campaign.end_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 优惠券管理 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">优惠券管理</h2>
          <button className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            创建优惠券
          </button>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            {/* 优惠券列表 */}
          </table>
        </div>
      </div>

      {/* 自动化规则 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">自动化规则</h2>
          <button className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            创建规则
          </button>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            {/* 自动化规则列表 */}
          </table>
        </div>
      </div>
    </div>
  );
} 