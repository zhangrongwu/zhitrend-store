export default function About() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              关于我们
            </h2>
            <p className="mt-6 text-lg text-gray-500">
              上海智潮磅礴科技有限公司是一家专注于电子商务解决方案的科技公司。我们致力于为企业提供现代化、高效的电商系统，
              帮助企业实现数字化转型。
            </p>
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900">联系方式</h3>
              <div className="mt-4 space-y-2 text-gray-600">
                <p>
                  <span className="font-medium">地址：</span>
                  上海市金山区枫泾镇朱枫公路9135号4幢
                </p>
                <p>
                  <span className="font-medium">邮箱：</span>
                  <a href="mailto:zhitrend@gmail.com" className="text-indigo-600 hover:text-indigo-500">
                    zhitrend@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 lg:mt-0">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">
              我们的优势
            </h3>
            <div className="mt-6 space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900">技术创新</h4>
                <p className="mt-2 text-gray-500">
                  采用最新的云原生技术，提供高性能、可扩展的电商解决方案。
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">安全可靠</h4>
                <p className="mt-2 text-gray-500">
                  严格的数据安全保护措施，确保您的业务数据安全。
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">专业服务</h4>
                <p className="mt-2 text-gray-500">
                  提供全面的技术支持和售后服务，确保系统稳定运行。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 