import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface RecommendationData {
  categoryBased: Product[];
  popular: Product[];
  similar: Product[];
}

export default function ProductRecommendations() {
  const { data: recommendations, isLoading } = useQuery<RecommendationData>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/recommendations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
  });

  if (isLoading) return null;

  return (
    <div className="space-y-8">
      {/* 基于类别的推荐 */}
      {recommendations?.categoryBased?.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">为您推荐</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recommendations?.categoryBased?.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group"
              >
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:opacity-75"
                  />
                </div>
                <h4 className="mt-2 text-sm text-gray-700">{product.name}</h4>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  ¥{product.price}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 热门商品 */}
      {recommendations?.popular?.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">热门商品</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recommendations?.popular?.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group"
              >
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:opacity-75"
                  />
                </div>
                <h4 className="mt-2 text-sm text-gray-700">{product.name}</h4>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  ¥{product.price}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 相似商品 */}
      {recommendations?.similar?.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">相似商品</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recommendations?.similar?.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group"
              >
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:opacity-75"
                  />
                </div>
                <h4 className="mt-2 text-sm text-gray-700">{product.name}</h4>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  ¥{product.price}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 