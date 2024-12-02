interface SearchOptions {
  keyword?: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'created_at_desc';
  page?: number;
  limit?: number;
}

export class SearchService {
  static async searchProducts(c: any, options: SearchOptions) {
    const { DB } = c.env;
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      sort = 'created_at_desc',
      page = 1,
      limit = 20
    } = options;

    try {
      let query = `
        SELECT 
          p.*,
          c.name as category_name,
          i.quantity as stock,
          COALESCE(AVG(r.score), 0) as avg_rating,
          COUNT(DISTINCT r.id) as review_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        LEFT JOIN ratings r ON p.id = r.product_id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      // 关键词搜索
      if (keyword) {
        query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      // 分类过滤
      if (category) {
        query += ` AND p.category_id = ?`;
        params.push(category);
      }

      // 价格范围
      if (minPrice !== undefined) {
        query += ` AND p.price >= ?`;
        params.push(minPrice);
      }
      if (maxPrice !== undefined) {
        query += ` AND p.price <= ?`;
        params.push(maxPrice);
      }

      // 分组
      query += ` GROUP BY p.id`;

      // 排序
      switch (sort) {
        case 'price_asc':
          query += ` ORDER BY p.price ASC`;
          break;
        case 'price_desc':
          query += ` ORDER BY p.price DESC`;
          break;
        default:
          query += ` ORDER BY p.created_at DESC`;
      }

      // 分页
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, (page - 1) * limit);

      const products = await DB.prepare(query).bind(...params).all();

      // 获取总数
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        WHERE 1=1
        ${keyword ? `AND (p.name LIKE ? OR p.description LIKE ?)` : ''}
        ${category ? `AND p.category_id = ?` : ''}
        ${minPrice !== undefined ? `AND p.price >= ?` : ''}
        ${maxPrice !== undefined ? `AND p.price <= ?` : ''}
      `;

      const countParams = params.slice(0, -2); // 移除分页参数
      const { total } = await DB.prepare(countQuery).bind(...countParams).first();

      // 记录搜索历史
      if (keyword && c.get('jwtPayload')?.id) {
        await DB.prepare(`
          INSERT INTO search_history (user_id, keyword)
          VALUES (?, ?)
        `).bind(c.get('jwtPayload').id, keyword).run();
      }

      return {
        products: products.results,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  static async getSearchSuggestions(c: any, keyword: string) {
    const { DB } = c.env;

    try {
      // 获取热门搜索
      const hotSearches = await DB.prepare(`
        SELECT 
          keyword,
          COUNT(*) as count
        FROM search_history
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY keyword
        ORDER BY count DESC
        LIMIT 5
      `).all();

      // 获取相关搜索
      const suggestions = await DB.prepare(`
        SELECT DISTINCT keyword
        FROM search_history
        WHERE keyword LIKE ?
        AND created_at >= datetime('now', '-30 days')
        GROUP BY keyword
        ORDER BY COUNT(*) DESC
        LIMIT 5
      `).bind(`%${keyword}%`).all();

      return {
        hot: hotSearches.results,
        suggestions: suggestions.results,
      };
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      throw error;
    }
  }
} 