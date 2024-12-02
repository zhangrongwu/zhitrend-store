import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon, UserGroupIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

interface UserAnalytics {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  };
  behaviorStats: {
    totalViews: number;
    totalSearches: number;
    totalCartAdds: number;
    totalPurchases: number;
  };
  topSearches: {
    keyword: string;
    count: number;
  }[];
  userRetention: {
    date: string;
    retention: number;
  }[];
  userBehaviorFlow: {
    action: string;
    count: number;
    nextActions: {
      action: string;
      count: number;
    }[];
  }[];
}

export default function UserAnalytics() {
  const { data: analytics, isLoading } = useQuery<UserAnalytics>({
    queryKey: ['user-analytics'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/admin/analytics/users', {
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
      <h2 className="text-2xl font-bold mb-8">用户行为分析</h2>

      {/* 用户统计 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">总用户数</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics?.userStats.totalUsers}
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
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">活跃用户</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics?.userStats.activeUsers}
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
                <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">新增用户</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics?.userStats.newUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 行为统计 */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">用户行为统计</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">浏览量</p>
            <p className="text-2xl font-semibold">{analytics?.behaviorStats.totalViews}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">搜索次数</p>
            <p className="text-2xl font-semibold">{analytics?.behaviorStats.totalSearches}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">加购次数</p>
            <p className="text-2xl font-semibold">{analytics?.behaviorStats.totalCartAdds}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">购买次数</p>
            <p className="text-2xl font-semibold">{analytics?.behaviorStats.totalPurchases}</p>
          </div>
        </div>
      </div>

      {/* 热门搜索 */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">热门搜索词</h3>
        <div className="space-y-4">
          {analytics?.topSearches.map((search, index) => (
            <div key={index} className="flex items-center">
              <span className="w-8 text-gray-500">{index + 1}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{search.keyword}</div>
                <div className="mt-1 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{
                        width: `${(search.count / analytics.topSearches[0].count) * 100}%`,
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <span className="ml-4 text-sm text-gray-500">{search.count}次</span>
            </div>
          ))}
        </div>
      </div>

      {/* 用户留存 */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">用户留存率</h3>
        <div className="h-64">
          {/* 这里可以使用图表库如 Chart.js 或 Recharts 来展示留存率趋势图 */}
          <div className="flex items-center justify-center h-full text-gray-500">
            留存率趋势图
          </div>
        </div>
      </div>

      {/* 行为路径分析 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">用户行为路径</h3>
        <div className="space-y-6">
          {analytics?.userBehaviorFlow.map((flow, index) => (
            <div key={index}>
              <div className="flex items-center mb-2">
                <div className="text-lg font-medium">{flow.action}</div>
                <span className="ml-2 text-sm text-gray-500">({flow.count}次)</span>
              </div>
              <div className="pl-8 space-y-2">
                {flow.nextActions.map((next, nextIndex) => (
                  <div key={nextIndex} className="flex items-center">
                    <svg
                      className="h-5 w-5 text-gray-400 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <div className="text-sm">{next.action}</div>
                    <span className="ml-2 text-xs text-gray-500">({next.count}次)</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 