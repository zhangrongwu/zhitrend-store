interface ProductScore {
  productId: number;
  score: number;
}

export class ProductRecommendationService {
  // 获取用户个性化推荐
  static async getPersonalizedRecommendations(c: any, userId: number): Promise<number[]> {
    const { DB } = c.env;

    try {
      // 获取用户行为数据
      const behaviors = await DB.prepare(`
        SELECT 
          product_id,
          action_type,
          COUNT(*) as count
        FROM user_behaviors
        WHERE user_id = ?
        GROUP BY product_id, action_type
      `).bind(userId).all();

      // 计算商品得分
      const productScores = this.calculateProductScores(behaviors.results);

      // 获取相似商品
      const recommendations = await this.getSimilarProducts(c, productScores);

      return recommendations.map(r => r.productId);
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      throw error;
    }
  }

  // 计算商品得分
  private static calculateProductScores(behaviors: any[]): ProductScore[] {
    const scores = new Map<number, number>();

    // 不同行为的权重
    const weights = {
      view: 1,
      cart: 2,
      purchase: 3,
    };

    // 计算每个商品的得分
    for (const behavior of behaviors) {
      const currentScore = scores.get(behavior.product_id) || 0;
      const weight = weights[behavior.action_type as keyof typeof weights];
      scores.set(behavior.product_id, currentScore + behavior.count * weight);
    }

    return Array.from(scores.entries()).map(([productId, score]) => ({
      productId,
      score,
    }));
  }

  // 获取相似商品
  private static async getSimilarProducts(c: any, productScores: ProductScore[]): Promise<ProductScore[]> {
    const { DB } = c.env;
    const topProducts = productScores.slice(0, 5);

    try {
      // 基于商品类别和属性查找相似商品
      const similarProducts = await DB.prepare(`
        SELECT 
          p2.id as product_id,
          COUNT(*) as similarity_score
        FROM products p1
        JOIN products p2 ON p1.category_id = p2.category_id
        WHERE p1.id IN (${topProducts.map(p => p.productId).join(',')})
        AND p2.id NOT IN (${topProducts.map(p => p.productId).join(',')})
        GROUP BY p2.id
        ORDER BY similarity_score DESC
        LIMIT 10
      `).all();

      return similarProducts.results.map((p: any) => ({
        productId: p.product_id,
        score: p.similarity_score,
      }));
    } catch (error) {
      console.error('Failed to get similar products:', error);
      throw error;
    }
  }

  // 获取热门商品
  static async getPopularProducts(c: any, limit: number = 10): Promise<number[]> {
    const { DB } = c.env;

    try {
      const popular = await DB.prepare(`
        SELECT 
          p.id,
          COUNT(DISTINCT ub.user_id) as user_count,
          COUNT(DISTINCT CASE WHEN ub.action_type = 'purchase' THEN ub.id END) as purchase_count
        FROM products p
        LEFT JOIN user_behaviors ub ON p.id = ub.product_id
        WHERE ub.created_at >= datetime('now', '-7 days')
        GROUP BY p.id
        ORDER BY purchase_count DESC, user_count DESC
        LIMIT ?
      `).bind(limit).all();

      return popular.results.map((p: any) => p.id);
    } catch (error) {
      console.error('Failed to get popular products:', error);
      throw error;
    }
  }

  // 获取新品推荐
  static async getNewProducts(c: any, limit: number = 10): Promise<number[]> {
    const { DB } = c.env;

    try {
      const newProducts = await DB.prepare(`
        SELECT id
        FROM products
        WHERE created_at >= datetime('now', '-30 days')
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(limit).all();

      return newProducts.results.map((p: any) => p.id);
    } catch (error) {
      console.error('Failed to get new products:', error);
      throw error;
    }
  }
} 