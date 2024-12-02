import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, CurrencyYenIcon } from '@heroicons/react/24/outline';

interface SalesData {
  daily: {
    date: string;
    sales: number;
    orders: number;
  }[];
  monthly: {
    month: string;
    sales: number;
    orders: number;
  }[];
  categoryStats: {
    category: string;
    sales: number;
    percentage: number;
  }[];
  topSellingProducts: {
    id: number;
    name: string;
    sales: number;
    revenue: number;
  }[];
}

export default function SalesReport() {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '12months'>('30days');

  const { data: salesData, isLoading } = useQuery<SalesData>({
    queryKey: ['sales-report', timeRange],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8787/api/admin/sales-report?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sales report');
      return response.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">销售报表</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="7days">最近7天</option>
          <option value="30days">最近30天</option>
          <option value="12months">最近12个月</option>
        </select>
      </div>

      {/* 销售趋势图表 */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">销售趋势</h3>
        <div className="h-64">
          {/* 这里可以使用图表库如 Chart.js 或 Recharts 来展示趋势图 */}
          <div className="flex items-center justify-center h-full text-gray-500">
            图表区域
          </div>
        </div>
      </div>

      {/* 分类销售统计 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">分类销售占比</h3>
          <div className="space-y-4">
            {salesData?.categoryStats.map((category) => (
              <div key={category.category}>
                <div className="flex justify-between text-sm font-medium">
                  <span>{category.category}</span>
                  <span>¥{category.sales.toLocaleString()}</span>
                </div>
                <div className="mt-1 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${category.percentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 热销商品 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">热销商品</h3>
          <div className="space-y-4">
            {salesData?.topSellingProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-500">销量: {product.sales}</p>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  ¥{product.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 销售指标 */}
      <div className="grid grid-cols-1 gap-5 mt-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">总订单数</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {salesData?.daily.reduce((sum, day) => sum + day.orders, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyYenIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">总销售额</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ¥{salesData?.daily.reduce((sum, day) => sum + day.sales, 0).toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">平均客单价</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ¥{Math.round(
                      salesData?.daily.reduce((sum, day) => sum + day.sales, 0) /
                      salesData?.daily.reduce((sum, day) => sum + day.orders, 0)
                    ).toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 