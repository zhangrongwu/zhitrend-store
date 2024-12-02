export function lazyLoad<T>(importFn: () => Promise<T>) {
  return React.lazy(() => {
    return new Promise((resolve) => {
      // 添加一个最小延迟以避免闪烁
      const start = performance.now();
      importFn().then((result) => {
        const end = performance.now();
        const timeElapsed = end - start;
        const minimumDelay = 100;
        if (timeElapsed < minimumDelay) {
          setTimeout(() => resolve(result), minimumDelay - timeElapsed);
        } else {
          resolve(result);
        }
      });
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