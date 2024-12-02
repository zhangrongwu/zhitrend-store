import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ExportData from '../../components/ExportData';

interface ReportData {
  salesByCategory: {
    category: string;
    sales: number;
    percentage: number;
  }[];
  salesByTime: {
    date: string;
    sales: number;
    orders: number;
  }[];
  customerStats: {
    newCustomers: number;
    repeatCustomers: number;
    averageOrderValue: number;
  };
  productPerformance: {
    id: number;
    name: string;
    sales: number;
    revenue: number;
    views: number;
    conversionRate: number;
  }[];
}

export default function Reports() {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '12months'>('30days');

  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ['reports', timeRange],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8787/api/admin/reports?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">数据报表</h2>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="7days">最近7天</option>
            <option value="30days">最近30天</option>
            <option value="12months">最近12个月</option>
          </select>
          <ExportData
            endpoint="reports"
            fileName={`report-${timeRange}`}
            buttonText="导出报表"
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* 销售概览 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">销售概览</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">新客户</p>
              <p className="mt-1 text-2xl font-semibold">
                {reportData?.customerStats.newCustomers}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">复购客户</p>
              <p className="mt-1 text-2xl font-semibold">
                {reportData?.customerStats.repeatCustomers}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">平均客单价</p>
              <p className="mt-1 text-2xl font-semibold">
                ¥{reportData?.customerStats.averageOrderValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* 分类销售占比 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">分类销售占比</h3>
          <div className="space-y-4">
            {reportData?.salesByCategory.map((category) => (
              <div key={category.category}>
                <div className="flex justify-between text-sm">
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

        {/* 商品表现 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">商品表现</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    销量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    销售额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    浏览量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    转化率
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.productPerformance.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ¥{product.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(product.conversionRate * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 销售趋势 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">销售趋势</h3>
          <div className="h-64">
            {/* 这里可以使用图表库如 Chart.js 或 Recharts 来展示趋势图 */}
            <div className="flex items-center justify-center h-full text-gray-500">
              销售趋势图
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 