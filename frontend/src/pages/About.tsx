export default function About() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">关于我们</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
            我们致力于为用户提供优质的购物体验
          </p>
        </div>

        <div className="mt-20">
          <dl className="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 md:space-y-0">
            <div className="relative">
              <dt>
                <div className="absolute flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white">
                  1
                </div>
                <p className="ml-16 text-lg font-medium leading-6 text-gray-900">优质商品</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                我们精心挑选每一件商品，确保品质和价格的最佳平衡。
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white">
                  2
                </div>
                <p className="ml-16 text-lg font-medium leading-6 text-gray-900">快速配送</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                专业的物流团队，确保商品快速安全送达。
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white">
                  3
                </div>
                <p className="ml-16 text-lg font-medium leading-6 text-gray-900">售后保障</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                完善的售后服务体系，解决您的后顾之忧。
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white">
                  4
                </div>
                <p className="ml-16 text-lg font-medium leading-6 text-gray-900">客户至上</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                以客户需求为中心，不断改进我们的服务。
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-20">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">联系我们</h3>
          <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="text-lg font-medium text-gray-900">客服电话</h4>
              <p className="mt-2 text-base text-gray-500">400-123-4567</p>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">商务合作</h4>
              <p className="mt-2 text-base text-gray-500">business@example.com</p>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">媒体咨询</h4>
              <p className="mt-2 text-base text-gray-500">press@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 