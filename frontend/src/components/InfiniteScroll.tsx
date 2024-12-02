import { useEffect, useRef, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface InfiniteScrollProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  children: React.ReactNode;
  threshold?: number;
}

export default function InfiniteScroll({
  loadMore,
  hasMore,
  isLoading,
  children,
  threshold = 100
}: InfiniteScrollProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          setIsLoadingMore(true);
          await loadMore();
          setIsLoadingMore(false);
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadMore, threshold]);

  return (
    <>
      {children}
      <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
        {(isLoading || isLoadingMore) && hasMore && <LoadingSpinner />}
      </div>
    </>
  );
} 