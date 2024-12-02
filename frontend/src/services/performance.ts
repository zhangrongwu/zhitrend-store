export function initPerformanceMonitoring() {
  // 创建一个队列来批量处理性能数据
  let metricsQueue: any[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  // 批量发送函数
  const sendBatchMetrics = () => {
    if (metricsQueue.length === 0) return;

    fetch('http://localhost:8787/api/performance/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metricsQueue),
    }).catch(console.error);

    metricsQueue = [];
  };

  // 添加到队列并设置延迟发送
  const queueMetrics = (metrics: any) => {
    metricsQueue.push(metrics);
    
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // 设置新的定时器，5秒后发送
    timeoutId = setTimeout(sendBatchMetrics, 5000);
  };

  // 监控页面加载性能
  window.addEventListener('load', () => {
    const { 
      domContentLoadedEventEnd,
      loadEventEnd,
      navigationStart 
    } = performance.timing;

    queueMetrics({
      type: 'page',
      metrics: {
        pageLoadTime: loadEventEnd - navigationStart,
        domReadyTime: domContentLoadedEventEnd - navigationStart,
      }
    });
  });

  // 监控资源加载性能
  const processedResources = new Set();
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      // 只处理未处理过的资源
      if (entry.entryType === 'resource' && !processedResources.has(entry.name)) {
        processedResources.add(entry.name);
        
        // 忽略性能监控相关的请求
        if (entry.name.includes('/api/performance')) {
          return;
        }

        // 只监控重要资源
        const importantTypes = ['script', 'css', 'img', 'fetch'];
        if (importantTypes.includes(entry.initiatorType)) {
          queueMetrics({
            type: 'resource',
            metrics: {
              name: entry.name,
              duration: entry.duration,
              transferSize: entry.transferSize,
              initiatorType: entry.initiatorType,
            }
          });
        }
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });

  // 在页面卸载前发送剩余的指标
  window.addEventListener('beforeunload', () => {
    if (metricsQueue.length > 0) {
      sendBatchMetrics();
    }
  });
} 