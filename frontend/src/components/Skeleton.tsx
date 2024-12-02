interface SkeletonProps {
  type?: 'text' | 'image' | 'card';
  count?: number;
}

export default function Skeleton({ type = 'text', count = 1 }: SkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        );
      case 'image':
        return (
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 animate-pulse" />
        );
      case 'card':
        return (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
} 