import Sharp from '@cloudflare/sharp';

interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export class ImageOptimizerService {
  // 优化单个图片
  static async optimizeImage(
    image: ArrayBuffer,
    options: ImageOptimizeOptions = {}
  ): Promise<{ data: Buffer; format: string; size: number }> {
    const {
      width,
      height,
      quality = 80,
      format = 'webp',
      fit = 'cover'
    } = options;

    try {
      let sharpInstance = Sharp(image);

      // 调整尺寸
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, { fit });
      }

      // 根据图片内容选择最佳格式
      const metadata = await sharpInstance.metadata();
      let outputFormat = format;
      
      // 如果是透明图片，使用WebP
      if (metadata.hasAlpha) {
        outputFormat = 'webp';
      }
      
      // 根据图片类型和大小选择最佳格式
      if (metadata.size && metadata.size > 100 * 1024) { // 大于100KB
        if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
          outputFormat = 'webp';
        } else if (metadata.format === 'png' && !metadata.hasAlpha) {
          outputFormat = 'webp';
        }
      }

      // 应用格式和压缩
      switch (outputFormat) {
        case 'webp':
          sharpInstance = sharpInstance.webp({ 
            quality,
            effort: 6, // 0-6, 更高的值意味着更慢的压缩但更好的质量
            nearLossless: true,
          });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({ 
            quality,
            effort: 9, // 0-9
            chromaSubsampling: '4:2:0',
          });
          break;
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ 
            quality,
            progressive: true,
            mozjpeg: true,
          });
          break;
      }

      // 应用通用优化
      sharpInstance = sharpInstance
        .normalize() // 标准化颜色
        .stripMetadata() // 移除元数据
        .trim(); // 移除空白边缘

      const outputBuffer = await sharpInstance.toBuffer();

      return {
        data: outputBuffer,
        format: outputFormat,
        size: outputBuffer.length,
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw error;
    }
  }

  // 生成响应式图片集
  static async generateResponsiveImages(
    image: ArrayBuffer,
    breakpoints: number[] = [640, 768, 1024, 1280]
  ): Promise<{ [width: number]: { url: string; format: string } }> {
    const results: { [width: number]: { url: string; format: string } } = {};

    for (const width of breakpoints) {
      const optimized = await this.optimizeImage(image, {
        width,
        format: 'webp',
      });

      // 生成文件名
      const hash = await this.generateHash(optimized.data);
      const fileName = `${width}w-${hash}.${optimized.format}`;

      // 上传到R2
      // 这里需要实现上传逻辑
      const url = `https://your-r2-bucket.com/${fileName}`;

      results[width] = {
        url,
        format: optimized.format,
      };
    }

    return results;
  }

  // 生成srcset字符串
  static generateSrcset(responsiveImages: { [width: number]: { url: string } }): string {
    return Object.entries(responsiveImages)
      .map(([width, { url }]) => `${url} ${width}w`)
      .join(', ');
  }

  // 生成文件hash
  private static async generateHash(buffer: Buffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 8);
  }

  // 检测图片类型
  private static async detectImageType(buffer: Buffer): Promise<string> {
    const signature = buffer.slice(0, 4).toString('hex');
    
    switch (signature) {
      case '89504e47':
        return 'png';
      case 'ffd8ffe0':
      case 'ffd8ffe1':
      case 'ffd8ffe2':
        return 'jpeg';
      case '47494638':
        return 'gif';
      case '52494646':
        return 'webp';
      default:
        throw new Error('Unsupported image format');
    }
  }

  // 估算压缩后的大小
  private static estimateCompressedSize(
    originalSize: number,
    format: string,
    quality: number
  ): number {
    const compressionRatios = {
      webp: 0.6,
      avif: 0.4,
      jpeg: 0.7,
    };

    const ratio = compressionRatios[format as keyof typeof compressionRatios] || 0.8;
    return Math.round(originalSize * ratio * (quality / 100));
  }

  // 自动选择最佳格式
  private static selectBestFormat(
    originalFormat: string,
    hasAlpha: boolean,
    size: number
  ): string {
    if (hasAlpha) {
      return 'webp'; // WebP对透明图片有很好的支持
    }

    if (size > 1024 * 1024) { // 大于1MB
      return 'avif'; // AVIF提供最好的压缩率
    }

    if (originalFormat === 'jpeg' || originalFormat === 'jpg') {
      return size > 100 * 1024 ? 'webp' : 'jpeg';
    }

    return 'webp'; // 默认使用WebP
  }
} 