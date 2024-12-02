import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

export default function Home() {
  const { data: featuredProducts } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/products?featured=true');
      if (!response.ok) throw new Error('Failed to fetch featured products');
      return response.json();
    },
  });

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative bg-gray-900">
        <div className="relative h-80 overflow-hidden md:h-96">
          <div className="absolute inset-0">
            <img
              src="/hero-image.jpg"
              alt="Hero"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gray-900 opacity-50" />
          </div>
          <div className="relative flex h-full items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                欢迎来到我们的商城
              </h1>
              <p className="mt-4 text-xl text-white">
                发现优质商品，享受购物乐趣
              </p>
              <div className="mt-8">
                <Link
                  to="/products"
                  className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700"
                >
                  开始购物
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured products section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">精选商品</h2>
        <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {featuredProducts?.map((product) => (
            <div key={product.id} className="group relative">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover object-center group-hover:opacity-75"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <Link to={`/products/${product.id}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.description}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">¥{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features section */}
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="text-center">
              <div className="flex justify-center">
                <svg
                  className="h-12 w-12 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">快速配送</h3>
              <p className="mt-2 text-base text-gray-500">
                全国范围内48小时送达
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <svg
                  className="h-12 w-12 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">安全支付</h3>
              <p className="mt-2 text-base text-gray-500">
                多种支付方式，安全有保障
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <svg
                  className="h-12 w-12 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">轻松购物</h3>
              <p className="mt-2 text-base text-gray-500">
                简单便捷的购物体验
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 