import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloadImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
  blur?: boolean;
  threshold?: number;
}

export default function PreloadImage({
  src,
  alt,
  className = '',
  onLoad,
  onError,
  fallback = '/images/placeholder.jpg',
  blur = true,
  threshold = 0.5,
}: PreloadImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setIsLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      setError(true);
      onError?.();
    };

    const element = document.querySelector(`[data-image-src="${src}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, onLoad, onError, threshold]);

  return (
    <div
      data-image-src={src}
      className={`relative overflow-hidden ${className}`}
    >
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-200 animate-pulse"
          />
        )}
      </AnimatePresence>

      {isVisible && (
        <motion.img
          src={error ? fallback : src}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-300 ${
            blur && !isLoaded ? 'blur-lg scale-105' : 'blur-0 scale-100'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
} 