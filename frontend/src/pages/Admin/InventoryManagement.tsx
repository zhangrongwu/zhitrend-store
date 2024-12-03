import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Alert from '../../components/Alert';
import { ArrowUpIcon, ArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  low_stock_threshold: number;
  last_restock_date: string;
}

interface InventoryLog {
  id: number;
  product_id: number;
  product_name: string;
  quantity_change: number;
  type: 'in' | 'out' | 'adjust';
  reason: string;
  created_at: string;
}

export default function InventoryManagement() {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/admin/inventory', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
  });

  const { data: logs } = useQuery<InventoryLog[]>({
    queryKey: ['inventory-logs'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/admin/inventory/logs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch inventory logs');
      return response.json();
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number; type: string; reason: string }) => {
      const response = await fetch('http://localhost:8787/api/admin/inventory/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update inventory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['inventory', 'inventory-logs'] 
      });
      resetForm();
      setAlert({ type: 'success', message: '库存更新成功！' });
    },
    onError: () => {
      setAlert({ type: 'error', message: '库存更新失败，请重试。' });
    },
  });

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity('');
    setReason('');
  };

  const handleSubmit = async (type: 'in' | 'out' | 'adjust') => {
    if (!selectedProduct || !quantity || !reason) {
      setAlert({ type: 'error', message: '请填写所有必填字段' });
      return;
    }

    try {
      await updateInventoryMutation.mutateAsync({
        productId: selectedProduct,
        quantity: parseInt(quantity),
        type,
        reason,
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
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

      <div className="space-y-8">
        {/* 库存操作表单 */}
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium mb-6">库存操作</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">选择商品</label>
              <select
                value={selectedProduct || ''}
                onChange={(e) => setSelectedProduct(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">请选择商品</option>
                {inventory?.map((item) => (
                  <option key={item.product_id} value={item.product_id}>
                    {item.product_name} (当前库存: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">数量</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">原因</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => handleSubmit('in')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                <ArrowUpIcon className="h-5 w-5 mr-2" />
                入库
              </button>
              <button
                onClick={() => handleSubmit('out')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <ArrowDownIcon className="h-5 w-5 mr-2" />
                出库
              </button>
              <button
                onClick={() => handleSubmit('adjust')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
              >
                调整
              </button>
            </div>
          </div>
        </div>

        {/* 库存列表 */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">库存状态</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      当前库存
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      库存预警值
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最后入库时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.low_stock_threshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.last_restock_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.quantity <= item.low_stock_threshold ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            库存不足
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 操作记录 */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">最近操作记录</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      数量变化
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      原因
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs?.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.type === 'in' ? '入库' : log.type === 'out' ? '出库' : '调整'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 