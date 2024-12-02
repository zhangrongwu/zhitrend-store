import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

interface ImageCompressorProps {
  onCompress: (file: File) => void;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  className?: string;
  accept?: string;
}

export default function ImageCompressor({
  onCompress,
  maxSizeMB = 1,
  maxWidthOrHeight = 1920,
  className = '',
  accept = 'image/*'
}: ImageCompressorProps) {
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      setProgress(0);

      // 基本压缩选项
      const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        onProgress: (p: number) => setProgress(Math.round(p * 100)),
        // 根据文件类型选择最佳压缩格式
        fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        // 保持图片方向
        preserveExif: true,
      };

      // 如果是 PNG 且没有透明通道，转换为 JPEG
      if (file.type === 'image/png') {
        const hasAlpha = await checkHasAlpha(file);
        if (!hasAlpha) {
          options.fileType = 'image/jpeg';
        }
      }

      const compressedFile = await imageCompression(file, options);

      // 如果压缩后文件更大，使用原文件
      if (compressedFile.size > file.size) {
        onCompress(file);
      } else {
        onCompress(compressedFile);
      }
    } catch (error) {
      console.error('Image compression failed:', error);
      // 压缩失败时使用原文件
      onCompress(file);
    } finally {
      setCompressing(false);
      setProgress(0);
    }
  }, [maxSizeMB, maxWidthOrHeight, onCompress]);

  // 检查 PNG 图片是否包含透明通道
  const checkHasAlpha = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            resolve(true);
            return;
          }
        }
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept={accept}
        onChange={handleImageChange}
        disabled={compressing}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {compressing && (
        <div className="mt-2">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  压缩进度
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 