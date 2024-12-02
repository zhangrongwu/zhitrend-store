interface CustomErrorEvent {
  message: string;
  stack?: string;
  userId?: string | null;
  timestamp?: number;
  userAgent?: string;
  url?: string;
  line?: number;
  column?: number;
}

export function initErrorTracking() {
  // 捕获未处理的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    reportError({
      message: error.message || 'Unhandled Promise Rejection',
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('userId'),
    });
  });

  // 捕获运行时错误
  window.addEventListener('error', (event) => {
    reportError({
      message: event.message,
      stack: event.error?.stack,
      url: event.filename,
      line: event.lineno,
      column: event.colno,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('userId'),
    });
  });
}

async function reportError(error: CustomErrorEvent) {
  try {
    await fetch('http://localhost:8787/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(error),
    });
  } catch (e) {
    console.error('Failed to report error:', e);
  }
} 