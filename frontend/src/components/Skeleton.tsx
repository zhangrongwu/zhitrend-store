interface SkeletonProps {
  count?: number;
  height?: string;
  width?: string;
  className?: string;
}

export default function Skeleton({ count = 1, height = "20px", width = "100%", className = "" }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
          style={{ height, width }}
        />
      ))}
    </>
  );
} 