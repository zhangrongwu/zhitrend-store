import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; {new Date().getFullYear()} {' '}
              <a 
                href="https://zhitrend.us.kg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-indigo-600"
              >
                上海智潮磅礴科技有限公司
              </a>
              . All rights reserved.
            </p>
            <p className="text-center text-xs leading-5 text-gray-500 mt-2">
              地址：上海市金山区枫泾镇朱枫公路9135号4幢
            </p>
            <p className="text-center text-xs leading-5 text-gray-500 mt-1">
              联系邮箱：
              <a href="mailto:zhitrend@gmail.com" className="text-indigo-600 hover:text-indigo-500">
                zhitrend@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 