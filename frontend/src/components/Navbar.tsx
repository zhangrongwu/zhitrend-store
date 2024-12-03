import { Fragment, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ShoppingCartIcon, 
  BellIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface CartCount {
  count: number;
}

interface Notification {
  id: number;
  message: string;
  created_at: string;
  read: boolean;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: cartCount } = useQuery<CartCount>({
    queryKey: ['cartCount'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/cart/count', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch cart count');
      return response.json();
    },
    enabled: !!user,
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/notifications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!user,
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Disclosure as="nav" className="bg-white shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <a 
                  href="https://zhitrend.us.kg" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex flex-shrink-0 items-center"
                >
                  <img
                    className="h-8 w-auto"
                    src="/images/logo.svg"
                    alt="智潮磅礴科技"
                  />
                </a>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      location.pathname === '/'
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    首页
                  </Link>
                  <Link
                    to="/products"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      location.pathname === '/products'
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    商品
                  </Link>
                  <Link
                    to="/about"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      location.pathname === '/about'
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    关于
                  </Link>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {user ? (
                  <>
                    <Link to="/cart" className="relative p-2">
                      <ShoppingCartIcon className="h-6 w-6 text-gray-400 hover:text-gray-500" />
                      {cartCount && cartCount.count > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                          {cartCount.count}
                        </span>
                      )}
                    </Link>
                    <div className="relative ml-3">
                      <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2"
                      >
                        <BellIcon className="h-6 w-6 text-gray-400 hover:text-gray-500" />
                        {unreadCount > 0 && (
                          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      <Transition
                        show={showNotifications}
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <div className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                          {notifications?.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-2 text-sm ${
                                notification.read ? 'text-gray-500' : 'text-gray-900 font-medium'
                              }`}
                            >
                              {notification.message}
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Transition>
                    </div>
                    <Menu as="div" className="relative ml-3">
                      <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        <span className="sr-only">Open user menu</span>
                        <img
                          className="h-8 w-8 rounded-full"
                          src={`https://ui-avatars.com/api/?name=${user.name}`}
                          alt=""
                        />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/profile"
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } block px-4 py-2 text-sm text-gray-700`}
                              >
                                个人中心
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/orders"
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } block px-4 py-2 text-sm text-gray-700`}
                              >
                                我的订单
                              </Link>
                            )}
                          </Menu.Item>
                          {user.role === 'admin' && (
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to="/admin"
                                  className={`${
                                    active ? 'bg-gray-100' : ''
                                  } block px-4 py-2 text-sm text-gray-700`}
                                >
                                  管理后台
                                </Link>
                              )}
                            </Menu.Item>
                          )}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                              >
                                退出登录
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                  >
                    登录/注册
                  </Link>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              <Link
                to="/"
                className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              >
                首页
              </Link>
              <Link
                to="/products"
                className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              >
                商品
              </Link>
              <Link
                to="/about"
                className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              >
                关于
              </Link>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
} 