import { useEffect, useRef } from 'react';
import { Chart as ChartJS, ChartConfiguration } from 'chart.js/auto';

interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
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
  height?: number;
  width?: number;
}

export default function Chart({ type, data, options = {}, height = 400, width = 600 }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 销毁旧的图表实例
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // 创建新的图表实例
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options,
      },
    };

    chartRef.current = new ChartJS(ctx, config);

    // 清理函数
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data, options]);

  return (
    <div style={{ height, width }}>
      <canvas ref={canvasRef} />
    </div>
  );
} 