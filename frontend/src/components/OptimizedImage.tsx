import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  quality = 75,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    // 构建优化后的图片URL
    const url = new URL(src);
    const params = new URLSearchParams(url.search);
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    url.search = params.toString();
    setImageSrc(url.toString());

    // 如果是优先加载的图片，预加载
    if (priority) {
      const img = new Image();
      img.src = url.toString();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setError(true);
    }
  }, [src, width, height, quality, priority]);

  if (error) {
    return (
      <div className={`bg-gray-200 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-500">加载失败</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-200 animate-pulse"
          />
        )}
      </AnimatePresence>
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
} 