import { useEffect, useState } from 'react';

interface Metrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<Metrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
  });

  useEffect(() => {
    // First Contentful Paint
    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          setMetrics((prev) => ({ ...prev, fcp: entry.startTime }));
        }
      });
    });
    paintObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setMetrics((prev) => ({ ...prev, lcp: lastEntry.startTime }));
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-input') {
          setMetrics((prev) => ({ ...prev, fid: entry.processingStart - entry.startTime }));
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsScore = 0;
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });
      setMetrics((prev) => ({ ...prev, cls: clsScore }));
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    return () => {
      paintObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  // 只在开发环境下显示性能指标
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg text-sm">
      <h3 className="font-bold mb-2">性能指标</h3>
      <ul className="space-y-1">
        <li>FCP: {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : '测量中...'}</li>
        <li>LCP: {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : '测量中...'}</li>
        <li>FID: {metrics.fid ? `${Math.round(metrics.fid)}ms` : '测量中...'}</li>
        <li>CLS: {metrics.cls ? metrics.cls.toFixed(3) : '测量中...'}</li>
      </ul>
    </div>
  );
} 