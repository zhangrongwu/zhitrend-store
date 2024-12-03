import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface ProductAnalytics {
  productStats: {
    id: number;
    name: string;
    views: number;
    cartAdds: number;
    sales: number;
    revenue: number;
    conversionRate: number;
  }[];
  categoryPerformance: {
    category: string;
    sales: number;
    revenue: number;
    products: number;
  }[];
  priceRangeAnalysis: {
    range: string;
    products: number;
    sales: number;
    revenue: number;
  }[];
  viewToCartRate: {
    product_id: number;
    name: string;
    views: number;
    cartAdds: number;
    rate: number;
  }[];
}

export default function ProductAnalytics() {
  const { data: analytics, isLoading } = useQuery<ProductAnalytics>({
    queryKey: ['product-analytics'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/admin/analytics/products', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold mb-8">商品分析</h2>

      {/* 商品表现 */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">商品表现</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  浏览量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  加购次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  销量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  销售额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  转化率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.productStats.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.cartAdds}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ¥{product.revenue.toLocaleString()}
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

      {/* 分类表现 */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">分类表现</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {analytics?.categoryPerformance.map((category) => (
            <div key={category.category} className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-base font-medium text-gray-900">{category.category}</h4>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">商品数</dt>
                  <dd className="text-lg font-medium text-gray-900">{category.products}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">销量</dt>
                  <dd className="text-lg font-medium text-gray-900">{category.sales}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm text-gray-500">销售额</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ¥{category.revenue.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>

      {/* 价格区间分析 */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">价格区间分析</h3>
        <div className="space-y-4">
          {analytics?.priceRangeAnalysis.map((range) => (
            <div key={range.range}>
              <div className="flex justify-between text-sm">
                <span>{range.range}</span>
                <span>¥{range.revenue.toLocaleString()}</span>
              </div>
              <div className="mt-1 relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{
                      width: `${(range.sales / Math.max(...analytics.priceRangeAnalysis.map(r => r.sales))) * 100}%`,
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{range.products} 个商品</span>
                <span>{range.sales} 件销量</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 浏览转化分析 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">浏览转化分析</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  浏览量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  加购次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  转化率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.viewToCartRate.map((product) => (
                <tr key={product.product_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.cartAdds}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(product.rate * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 