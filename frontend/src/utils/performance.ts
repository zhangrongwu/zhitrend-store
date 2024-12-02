import React from 'react';

export function lazyLoad<T extends { default: React.ComponentType<any> }>(importFn: () => Promise<T>) {
  return React.lazy(() => {
    const minimumDelay = 300;
    const startTime = Date.now();

    return importFn().then(result => {
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed < minimumDelay) {
        return new Promise(resolve => {
          setTimeout(() => resolve(result), minimumDelay - timeElapsed);
        });
      }
      return result;
    });
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export const imageLoader = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve();
    img.onerror = reject;
  });
};

export const preloadImages = async (urls: string[]) => {
  try {
    await Promise.all(urls.map(imageLoader));
  } catch (error) {
    console.error('Failed to preload images:', error);
  }
};

export function measurePerformance(name: string) {
  const start = performance.now();
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`${name} took ${duration}ms`);
      return duration;
    }
  };
}

export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export function prefetch(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to prefetch: ${url}`));
    document.head.appendChild(link);
  });
} 