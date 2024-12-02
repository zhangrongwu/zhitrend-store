import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-white border-t">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">微信</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.07 16.316c-.42 0-.819-.04-1.197-.122L4.21 17.497l.637-2.105c-1.175-.857-1.876-1.958-1.876-3.125 0-2.392 2.277-4.333 5.098-4.333 2.503 0 4.687 1.525 5.127 3.593-.174-.027-.35-.04-.527-.04-2.32 0-4.2 1.732-4.2 3.867 0 .355.054.698.155 1.026-.17-.04-.347-.064-.527-.064zM20.5 19l.823-2.67c.952-.695 1.677-1.708 1.677-2.83 0-2.392-2.277-4.333-5.098-4.333-2.82 0-5.098 1.94-5.098 4.333 0 2.392 2.277 4.333 5.098 4.333.642 0 1.257-.074 1.82-.213l2.657.87-.879-2.49z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <div className="flex flex-col items-center md:items-start space-y-4">
              <img
                className="h-8 w-auto"
                src="/images/logo.svg"
                alt="智潮磅礴科技"
              />
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
              <div className="flex flex-col items-center md:items-start space-y-2">
                <p className="text-xs leading-5 text-gray-500">
                  地址：上海市金山区枫泾镇朱枫公路9135号4幢
                </p>
                <p className="text-xs leading-5 text-gray-500">
                  联系邮箱：
                  <a href="mailto:zhitrend@gmail.com" className="text-indigo-600 hover:text-indigo-500">
                    zhitrend@gmail.com
                  </a>
                </p>
                <p className="text-xs leading-5 text-gray-500">
                  <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
                    沪ICP备2024XXXXXX号-1
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 md:order-3 md:mt-0">
            <h3 className="text-sm font-semibold leading-6 text-gray-900">友情链接</h3>
            <ul role="list" className="mt-2 space-y-2">
              <li>
                <a href="#" className="text-sm leading-6 text-gray-600 hover:text-indigo-600">
                  合作伙伴
                </a>
              </li>
              <li>
                <a href="#" className="text-sm leading-6 text-gray-600 hover:text-indigo-600">
                  开发文档
                </a>
              </li>
              <li>
                <a href="#" className="text-sm leading-6 text-gray-600 hover:text-indigo-600">
                  技术支持
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
} 