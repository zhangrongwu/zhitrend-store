import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  CubeIcon,
  TagIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: '仪表板', href: '/admin', icon: ChartBarIcon },
  { name: '商品管理', href: '/admin/products', icon: CubeIcon },
  { name: '分类管理', href: '/admin/categories', icon: TagIcon },
  { name: '订单管理', href: '/admin/orders', icon: ShoppingBagIcon },
  { name: '用户管理', href: '/admin/users', icon: UserGroupIcon },
  { name: '营销管理', href: '/admin/marketing', icon: CurrencyDollarIcon },
  { name: '库存管理', href: '/admin/inventory', icon: ClipboardDocumentListIcon },
  { name: '数据报表', href: '/admin/reports', icon: DocumentChartBarIcon },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-gray-800">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <img
                  className="h-8 w-auto"
                  src="/logo-white.svg"
                  alt="Your Company"
                />
              </div>
              <nav className="mt-5 flex-1 space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        group flex items-center px-2 py-2 text-sm font-medium rounded-md
                        ${isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                    >
                      <item.icon
                        className={`
                          mr-3 h-6 w-6 flex-shrink-0
                          ${isActive
                            ? 'text-white'
                            : 'text-gray-400 group-hover:text-gray-300'
                          }
                        `}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
} 