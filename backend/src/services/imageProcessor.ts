interface ImageProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  watermark?: {
    text: string;
    position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  };
}

export class ImageProcessorService {
  // 批量处理图片
  static async batchProcess(c: any, files: File[], options: ImageProcessOptions): Promise<string[]> {
    const { R2 } = c.env;
    const processedUrls: string[] = [];

    try {
      for (const file of files) {
        // 读取图片数据
        const arrayBuffer = await file.arrayBuffer();
        const image = new Uint8Array(arrayBuffer);

        // 处理图片
        const processedImage = await this.processImage(image, options);

        // 生成唯一文件名
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${options.format || 'jpeg'}`;

        // 上传到 R2
        await R2.put(fileName, processedImage, {
          httpMetadata: {
            contentType: `image/${options.format || 'jpeg'}`,
            cacheControl: 'public, max-age=31536000',
          },
        });

        // 获取公共访问URL
        const url = `https://${c.env.BUCKET_NAME}.r2.dev/${fileName}`;
        processedUrls.push(url);
      }

      return processedUrls;
    } catch (error) {
      console.error('Failed to process images:', error);
      throw error;
    }
  }

  // 处理单个图片
  private static async processImage(image: Uint8Array, options: ImageProcessOptions): Promise<Uint8Array> {
    // 这里使用 Sharp 或其他图片处理库
    // 由于 Workers 环境限制，可能需要使用 WebAssembly 版本
    // 或使用 Cloudflare Image Resizing 服务
    return image;
  }

  // 添加水印
  private static async addWatermark(image: Uint8Array, watermark: ImageProcessOptions['watermark']): Promise<Uint8Array> {
    if (!watermark) return image;
    // 添加水印逻辑
    return image;
  }

  // 生成缩略图
  static async generateThumbnails(c: any, imageUrl: string, sizes: number[]): Promise<string[]> {
    const thumbnailUrls: string[] = [];

    try {
      for (const size of sizes) {
        const thumbnailUrl = await this.generateThumbnail(c, imageUrl, size);
        thumbnailUrls.push(thumbnailUrl);
      }

      return thumbnailUrls;
    } catch (error) {
      console.error('Failed to generate thumbnails:', error);
      throw error;
    }
  }

  // 生成单个缩略图
  private static async generateThumbnail(c: any, imageUrl: string, size: number): Promise<string> {
    // 使用 Cloudflare Image Resizing
    const url = new URL(imageUrl);
    url.searchParams.set('width', size.toString());
    url.searchParams.set('fit', 'cover');
    return url.toString();
  }

  // 优化图片
  static async optimizeImage(c: any, imageUrl: string): Promise<string> {
    try {
      const url = new URL(imageUrl);
      url.searchParams.set('quality', '80');
      url.searchParams.set('format', 'webp');
      return url.toString();
    } catch (error) {
      console.error('Failed to optimize image:', error);
      throw error;
    }
  }
} 