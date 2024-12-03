import { useEffect, useRef } from 'react';
import { Chart as ChartJS } from 'chart.js/auto';

interface ChartProps {
  type: 'line' | 'bar' | 'pie';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }[];
  };
  options?: any;
}

export default function Chart({ type, data, options = {} }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // 销毁旧的图表实例
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // 创建新的图表实例
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new ChartJS(ctx, {
          type,
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            ...options,
          },
        });
      }
    }

    // 清理函数
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, options]);

  return <canvas ref={chartRef} />;
} 