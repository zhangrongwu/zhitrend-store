import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { hashPassword, comparePasswords, generateToken } from './utils/auth';
import { adminAuth } from './middleware/adminAuth';

const app = new Hono();

// 启用CORS
app.use('/*', cors());

// JWT中间件
const auth = jwt({
  secret: 'your-secret-key',
});

// 用户认证API
app.post('/api/auth/register', async (c) => {
  const { DB } = c.env;
  const { email, password, name } = await c.req.json();
  
  try {
    // 检查邮箱是否已存在
    const existingUser = await DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();
    
    if (existingUser) {
      return c.json({ error: 'Email already exists' }, 400);
    }
    
    // 加密密码
    const hashedPassword = await hashPassword(password);
    
    // 创建用户
    const result = await DB.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
    )
    .bind(email, hashedPassword, name)
    .run();
    
    // 生成token
    const token = await generateToken({ id: result.lastRowId });
    return c.json({ token });
  } catch (error) {
    return c.json({ error: 'Registration failed' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const { DB } = c.env;
  const { email, password } = await c.req.json();
  
  try {
    const user = await DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // 验证密码
    const isValid = await comparePasswords(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const token = await generateToken({ id: user.id });
    return c.json({ token });
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500);
  }
});

// 产品管理API
app.get('/api/products', async (c) => {
  const { DB } = c.env;
  try {
    const products = await DB.prepare(
      'SELECT * FROM products ORDER BY created_at DESC'
    ).all();
    return c.json(products);
  } catch (error) {
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.post('/api/products', auth(), async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    const { name, description, price, image } = data;
    const result = await DB.prepare(
      'INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)'
    )
    .bind(name, description, price, image)
    .run();
    
    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put('/api/products/:id', auth(), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const data = await c.req.json();
  
  try {
    const { name, description, price, image } = data;
    await DB.prepare(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ? WHERE id = ?'
    )
    .bind(name, description, price, image, id)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

app.delete('/api/products/:id', auth(), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    await DB.prepare('DELETE FROM products WHERE id = ?')
      .bind(id)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// 文件上传API
app.post('/api/upload', auth(), async (c) => {
  const { R2 } = c.env;
  try {
    const file = await c.req.file('file');
    if (!file) throw new Error('No file uploaded');
    
    const key = `uploads/${Date.now()}-${file.name}`;
    await R2.put(key, file.stream());
    
    const publicUrl = `https://${c.req.headers.get('host')}/${key}`;
    return c.json({ url: publicUrl });
  } catch (error) {
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// 获取单个产品
app.get('/api/products/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const product = await DB.prepare('SELECT * FROM products WHERE id = ?')
      .bind(id)
      .first();
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    return c.json(product);
  } catch (error) {
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// 购物车API
app.get('/api/cart', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  
  try {
    const cartItems = await DB.prepare(`
      SELECT ci.id, ci.quantity, p.* 
      FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.user_id = ?
    `)
    .bind(userId)
    .all();
    
    return c.json(cartItems);
  } catch (error) {
    return c.json({ error: 'Failed to fetch cart items' }, 500);
  }
});

app.post('/api/cart', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { productId, quantity } = await c.req.json();
  
  try {
    // 检查是否已在购物车中
    const existingItem = await DB.prepare(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
    )
    .bind(userId, productId)
    .first();
    
    if (existingItem) {
      // 更新数量
      await DB.prepare(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?'
      )
      .bind(quantity, existingItem.id)
      .run();
    } else {
      // 添加新项目
      await DB.prepare(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
      )
      .bind(userId, productId, quantity)
      .run();
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to add to cart' }, 500);
  }
});

app.put('/api/cart/:id', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const itemId = c.req.param('id');
  const { quantity } = await c.req.json();
  
  try {
    await DB.prepare(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?'
    )
    .bind(quantity, itemId, userId)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update cart item' }, 500);
  }
});

app.delete('/api/cart/:id', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const itemId = c.req.param('id');
  
  try {
    await DB.prepare(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?'
    )
    .bind(itemId, userId)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to remove cart item' }, 500);
  }
});

// 订单API
app.post('/api/orders', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { shippingAddress, contactPhone } = await c.req.json();
  
  try {
    // 获取购物车商品
    const cartItems = await DB.prepare(`
      SELECT ci.quantity, p.price, p.id as product_id 
      FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.user_id = ?
    `)
    .bind(userId)
    .all();
    
    if (!cartItems.results?.length) {
      return c.json({ error: 'Cart is empty' }, 400);
    }
    
    // 计算总金额
    const totalAmount = cartItems.results.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    );
    
    // 创建订单
    const orderResult = await DB.prepare(
      'INSERT INTO orders (user_id, total_amount, shipping_address, contact_phone) VALUES (?, ?, ?, ?)'
    )
    .bind(userId, totalAmount, shippingAddress, contactPhone)
    .run();
    
    const orderId = orderResult.lastRowId;
    
    // 创建订单项目
    for (const item of cartItems.results) {
      await DB.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
      )
      .bind(orderId, item.product_id, item.quantity, item.price)
      .run();
    }
    
    // 清空购物车
    await DB.prepare('DELETE FROM cart_items WHERE user_id = ?')
      .bind(userId)
      .run();
    
    return c.json({ orderId });
  } catch (error) {
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

app.get('/api/orders', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  
  try {
    const orders = await DB.prepare(`
      SELECT o.*, 
        GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `)
    .bind(userId)
    .all();
    
    return c.json(orders);
  } catch (error) {
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.get('/api/orders/:id', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const orderId = c.req.param('id');
  
  try {
    const order = await DB.prepare(`
      SELECT o.*, 
        json_group_array(
          json_object(
            'id', oi.id,
            'product_id', p.id,
            'name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = ? AND o.user_id = ?
      GROUP BY o.id
    `)
    .bind(orderId, userId)
    .first();
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    // Parse items JSON string
    order.items = JSON.parse(order.items);
    
    return c.json(order);
  } catch (error) {
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// 更新订单状态（仅管理员）
app.put('/api/orders/:id/status', auth(), async (c) => {
  const { DB } = c.env;
  const orderId = c.req.param('id');
  const { status } = await c.req.json();
  
  try {
    await DB.prepare('UPDATE orders SET status = ? WHERE id = ?')
      .bind(status, orderId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update order status' }, 500);
  }
});

// 支付API
app.post('/api/payments', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { orderId, paymentDetails } = await c.req.json();
  
  try {
    // 验证订单是否属于当前用户
    const order = await DB.prepare(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?'
    )
    .bind(orderId, userId)
    .first();
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    if (order.status !== 'pending') {
      return c.json({ error: 'Order cannot be paid' }, 400);
    }
    
    // 在实际应用中，这里应该调用支付网关API
    // 这里仅作为示例，直接更新订单状态
    await DB.prepare(
      'UPDATE orders SET status = ? WHERE id = ?'
    )
    .bind('paid', orderId)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Payment failed' }, 500);
  }
});

// 确认收货API
app.post('/api/orders/:id/confirm', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const orderId = c.req.param('id');
  
  try {
    const order = await DB.prepare(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?'
    )
    .bind(orderId, userId)
    .first();
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    if (order.status !== 'shipped') {
      return c.json({ error: 'Order cannot be confirmed' }, 400);
    }
    
    await DB.prepare(
      'UPDATE orders SET status = ? WHERE id = ?'
    )
    .bind('completed', orderId)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to confirm order' }, 500);
  }
});

// 用户个人中心API
app.get('/api/user/profile', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  
  try {
    const user = await DB.prepare(
      'SELECT id, email, name, created_at FROM users WHERE id = ?'
    )
    .bind(userId)
    .first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(user);
  } catch (error) {
    return c.json({ error: 'Failed to fetch user profile' }, 500);
  }
});

app.put('/api/user/profile', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { name } = await c.req.json();
  
  try {
    await DB.prepare('UPDATE users SET name = ? WHERE id = ?')
      .bind(name, userId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

app.put('/api/user/password', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { currentPassword, newPassword } = await c.req.json();
  
  try {
    const user = await DB.prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(userId)
      .first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const isValid = await comparePasswords(currentPassword, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Invalid current password' }, 401);
    }
    
    const newPasswordHash = await hashPassword(newPassword);
    await DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(newPasswordHash, userId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

// 评价API
app.post('/api/reviews', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { productId, orderId, rating, content } = await c.req.json();
  
  try {
    // 验证订单是否属于当前用户且已完成
    const order = await DB.prepare(
      'SELECT status FROM orders WHERE id = ? AND user_id = ?'
    )
    .bind(orderId, userId)
    .first();
    
    if (!order || order.status !== 'completed') {
      return c.json({ error: 'Cannot review this order' }, 400);
    }
    
    // 检查是否已评价
    const existingReview = await DB.prepare(
      'SELECT id FROM reviews WHERE order_id = ? AND product_id = ?'
    )
    .bind(orderId, productId)
    .first();
    
    if (existingReview) {
      return c.json({ error: 'Already reviewed' }, 400);
    }
    
    // 创建评价
    await DB.prepare(
      'INSERT INTO reviews (user_id, product_id, order_id, rating, content) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(userId, productId, orderId, rating, content)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to create review' }, 500);
  }
});

app.get('/api/products/:id/reviews', async (c) => {
  const { DB } = c.env;
  const productId = c.req.param('id');
  
  try {
    const reviews = await DB.prepare(`
      SELECT r.*, u.name as user_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `)
    .bind(productId)
    .all();
    
    return c.json(reviews);
  } catch (error) {
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// 管理员API
app.get('/api/admin/orders', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    const orders = await DB.prepare(`
      SELECT o.*, 
        GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `)
    .all();
    
    return c.json(orders);
  } catch (error) {
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.get('/api/admin/users', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    const users = await DB.prepare(`
      SELECT id, email, name, role, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();
    
    return c.json(users.results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.put('/api/admin/users/:id/role', adminAuth, async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('id');
  const { role } = await c.req.json();
  
  try {
    // 验证角色值
    if (!['admin', 'user'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }
    
    await DB.prepare('UPDATE users SET role = ? WHERE id = ?')
      .bind(role, userId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update user role' }, 500);
  }
});

// 分类API
app.get('/api/categories', async (c) => {
  const { DB } = c.env;
  
  try {
    const categories = await DB.prepare(
      'SELECT * FROM categories ORDER BY name'
    ).all();
    
    return c.json(categories);
  } catch (error) {
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

app.post('/api/categories', adminAuth, async (c) => {
  const { DB } = c.env;
  const { name, description } = await c.req.json();
  
  try {
    const result = await DB.prepare(
      'INSERT INTO categories (name, description) VALUES (?, ?)'
    )
    .bind(name, description)
    .run();
    
    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to create category' }, 500);
  }
});

app.put('/api/categories/:id', adminAuth, async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const { name, description } = await c.req.json();
  
  try {
    await DB.prepare(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?'
    )
    .bind(name, description, id)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update category' }, 500);
  }
});

app.delete('/api/categories/:id', adminAuth, async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    await DB.prepare('DELETE FROM categories WHERE id = ?')
      .bind(id)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete category' }, 500);
  }
});

// 收藏API
app.post('/api/favorites', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { productId } = await c.req.json();
  
  try {
    await DB.prepare(
      'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)'
    )
    .bind(userId, productId)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to add favorite' }, 500);
  }
});

app.delete('/api/favorites/:productId', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const productId = c.req.param('productId');
  
  try {
    await DB.prepare(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?'
    )
    .bind(userId, productId)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to remove favorite' }, 500);
  }
});

app.get('/api/favorites', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  
  try {
    const favorites = await DB.prepare(`
      SELECT p.*, f.created_at as favorited_at
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `)
    .bind(userId)
    .all();
    
    return c.json(favorites);
  } catch (error) {
    return c.json({ error: 'Failed to fetch favorites' }, 500);
  }
});

app.get('/api/favorites/check/:productId', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const productId = c.req.param('productId');
  
  try {
    const favorite = await DB.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?'
    )
    .bind(userId, productId)
    .first();
    
    return c.json({ isFavorited: !!favorite });
  } catch (error) {
    return c.json({ error: 'Failed to check favorite status' }, 500);
  }
});

// 管理员统计API
app.get('/api/admin/stats', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    // 获取总用户数
    const totalUsers = await DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();

    // 获取总订单数和总收入
    const orderStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value
      FROM orders
      WHERE status != 'cancelled'
    `).first();

    // 获取最近订单
    const recentOrders = await DB.prepare(`
      SELECT id, total_amount, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // 获取热销商品
    const topProducts = await DB.prepare(`
      SELECT 
        p.id,
        p.name,
        COUNT(oi.id) as sales
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY sales DESC
      LIMIT 5
    `).all();

    return c.json({
      totalUsers: totalUsers.count,
      totalOrders: orderStats.total_orders,
      totalRevenue: orderStats.total_revenue,
      averageOrderValue: orderStats.avg_order_value,
      recentOrders: recentOrders.results,
      topProducts: topProducts.results,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// 销售报表API
app.get('/api/admin/sales-report', adminAuth, async (c) => {
  const { DB } = c.env;
  const range = c.req.query('range') || '30days';
  
  try {
    let dateFilter;
    switch (range) {
      case '7days':
        dateFilter = "datetime('now', '-7 days')";
        break;
      case '30days':
        dateFilter = "datetime('now', '-30 days')";
        break;
      case '12months':
        dateFilter = "datetime('now', '-12 months')";
        break;
      default:
        dateFilter = "datetime('now', '-30 days')";
    }

    // 获每日销售数据
    const daily = await DB.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as sales
      FROM orders
      WHERE created_at >= ${dateFilter}
        AND status != 'cancelled'
      GROUP BY date(created_at)
      ORDER BY date
    `).all();

    // 获取每月销售数据
    const monthly = await DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as orders,
        SUM(total_amount) as sales
      FROM orders
      WHERE created_at >= ${dateFilter}
        AND status != 'cancelled'
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).all();

    // 获取分类销售统计
    const categoryStats = await DB.prepare(`
      SELECT 
        c.name as category,
        SUM(oi.quantity * oi.price) as sales,
        ROUND(SUM(oi.quantity * oi.price) * 100.0 / (
          SELECT SUM(quantity * price)
          FROM order_items oi2
          JOIN orders o2 ON oi2.order_id = o2.id
          WHERE o2.created_at >= ${dateFilter}
            AND o2.status != 'cancelled'
        ), 2) as percentage
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.created_at >= ${dateFilter}
        AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY sales DESC
    `).all();

    // 获取热销商品
    const topSellingProducts = await DB.prepare(`
      SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as sales,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.created_at >= ${dateFilter}
        AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY sales DESC
      LIMIT 5
    `).all();

    return c.json({
      daily: daily.results,
      monthly: monthly.results,
      categoryStats: categoryStats.results,
      topSellingProducts: topSellingProducts.results,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch sales report' }, 500);
  }
});

// 搜索相关API
app.post('/api/search/history', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { keyword } = await c.req.json();
  
  try {
    await DB.prepare(
      'INSERT INTO search_history (user_id, keyword) VALUES (?, ?)'
    )
    .bind(userId, keyword)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to save search history' }, 500);
  }
});

app.get('/api/search/history', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  
  try {
    const history = await DB.prepare(`
      SELECT DISTINCT keyword, MAX(created_at) as last_searched
      FROM search_history
      WHERE user_id = ?
      GROUP BY keyword
      ORDER BY last_searched DESC
      LIMIT 10
    `)
    .bind(userId)
    .all();
    
    return c.json(history);
  } catch (error) {
    return c.json({ error: 'Failed to fetch search history' }, 500);
  }
});

app.get('/api/search/suggestions', auth(), async (c) => {
  const { DB } = c.env;
  const keyword = c.req.query('q');
  
  try {
    // 从产品名称和描述中获取建议
    const productSuggestions = await DB.prepare(`
      SELECT DISTINCT name as suggestion, 'product' as type
      FROM products
      WHERE name LIKE ?
      LIMIT 5
    `)
    .bind(`%${keyword}%`)
    .all();

    // 从热门搜索中获取建议
    const popularSearches = await DB.prepare(`
      SELECT keyword as suggestion, 'history' as type, COUNT(*) as count
      FROM search_history
      WHERE keyword LIKE ?
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 5
    `)
    .bind(`%${keyword}%`)
    .all();

    return c.json({
      products: productSuggestions.results,
      popular: popularSearches.results,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch suggestions' }, 500);
  }
});

app.delete('/api/search/history/:keyword', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const keyword = c.req.param('keyword');
  
  try {
    await DB.prepare(
      'DELETE FROM search_history WHERE user_id = ? AND keyword = ?'
    )
    .bind(userId, keyword)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete search history' }, 500);
  }
});

// 记录用户行为
app.post('/api/behaviors', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { productId, actionType } = await c.req.json();
  
  try {
    await DB.prepare(
      'INSERT INTO user_behaviors (user_id, product_id, action_type) VALUES (?, ?, ?)'
    )
    .bind(userId, productId, actionType)
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to record behavior' }, 500);
  }
});

// 获取推荐商品
app.get('/api/recommendations', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  
  try {
    // 基于用户最近浏览和购买的商品类别推荐
    const categoryBasedRecommendations = await DB.prepare(`
      WITH user_categories AS (
        SELECT DISTINCT p.category_id
        FROM user_behaviors ub
        JOIN products p ON ub.product_id = p.id
        WHERE ub.user_id = ?
        ORDER BY ub.created_at DESC
        LIMIT 3
      )
      SELECT p.*
      FROM products p
      JOIN user_categories uc ON p.category_id = uc.category_id
      WHERE p.id NOT IN (
        SELECT product_id 
        FROM user_behaviors 
        WHERE user_id = ?
      )
      ORDER BY RANDOM()
      LIMIT 4
    `)
    .bind(userId, userId)
    .all();

    // 基于热门商品推荐
    const popularRecommendations = await DB.prepare(`
      SELECT p.*, COUNT(ub.id) as popularity
      FROM products p
      LEFT JOIN user_behaviors ub ON p.id = ub.product_id
      WHERE ub.created_at >= datetime('now', '-7 days')
      GROUP BY p.id
      ORDER BY popularity DESC
      LIMIT 4
    `)
    .all();

    // 基于最近查看的相似商品推荐
    const similarRecommendations = await DB.prepare(`
      WITH recent_views AS (
        SELECT product_id
        FROM user_behaviors
        WHERE user_id = ? AND action_type = 'view'
        ORDER BY created_at DESC
        LIMIT 1
      )
      SELECT p.*
      FROM products p
      JOIN recent_views rv
      JOIN products viewed ON viewed.id = rv.product_id
      WHERE p.category_id = viewed.category_id
        AND p.id != viewed.id
      ORDER BY RANDOM()
      LIMIT 4
    `)
    .bind(userId)
    .all();

    return c.json({
      categoryBased: categoryBasedRecommendations.results,
      popular: popularRecommendations.results,
      similar: similarRecommendations.results,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch recommendations' }, 500);
  }
});

// 导出API
app.get('/api/export/orders', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    const orders = await DB.prepare(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.shipping_address,
        o.contact_phone,
        o.created_at,
        u.email as user_email,
        GROUP_CONCAT(p.name || ' x' || oi.quantity) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all();

    // 生成CSV内容
    const headers = ['订单ID', '总金额', '状态', '收货地址', '联系电话', '下单时间', '用户邮箱', '商品清单'];
    const rows = orders.results.map(order => [
      order.id,
      order.total_amount,
      order.status,
      order.shipping_address,
      order.contact_phone,
      order.created_at,
      order.user_email,
      order.items,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=orders.csv',
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to export orders' }, 500);
  }
});

app.get('/api/export/products', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    const products = await DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.quantity) as total_sold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();

    const headers = ['商品ID', '名称', '描述', '价格', '分类', '创建时间', '订单数', '销量'];
    const rows = products.results.map(product => [
      product.id,
      product.name,
      product.description,
      product.price,
      product.category_name,
      product.created_at,
      product.order_count,
      product.total_sold,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=products.csv',
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to export products' }, 500);
  }
});

app.get('/api/export/users', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    const users = await DB.prepare(`
      SELECT 
        u.*,
        COUNT(DISTINCT o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    const headers = ['用户ID', '邮箱', '姓名', '角色', '注册时间', '订单数', '消费总额', '最后下单时间'];
    const rows = users.results.map(user => [
      user.id,
      user.email,
      user.name,
      user.role,
      user.created_at,
      user.order_count,
      user.total_spent,
      user.last_order_date,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=users.csv',
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to export users' }, 500);
  }
});

// 库存管理API
app.get('/api/admin/inventory', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    const inventory = await DB.prepare(`
      SELECT 
        i.*,
        p.name as product_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      ORDER BY p.name
    `).all();
    
    return c.json(inventory);
  } catch (error) {
    return c.json({ error: 'Failed to fetch inventory' }, 500);
  }
});

app.get('/api/admin/inventory/logs', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    const logs = await DB.prepare(`
      SELECT 
        il.*,
        p.name as product_name
      FROM inventory_logs il
      JOIN products p ON il.product_id = p.id
      ORDER BY il.created_at DESC
      LIMIT 50
    `).all();
    
    return c.json(logs);
  } catch (error) {
    return c.json({ error: 'Failed to fetch inventory logs' }, 500);
  }
});

app.post('/api/admin/inventory/update', adminAuth, async (c) => {
  const { DB } = c.env;
  const { productId, quantity, type, reason } = await c.req.json();
  
  try {
    await DB.prepare('BEGIN TRANSACTION').run();
    
    // 记录库存变更
    await DB.prepare(
      'INSERT INTO inventory_logs (product_id, quantity_change, type, reason) VALUES (?, ?, ?, ?)'
    )
    .bind(productId, quantity, type, reason)
    .run();
    
    // 更新库存
    if (type === 'in') {
      await DB.prepare(`
        UPDATE inventory 
        SET quantity = quantity + ?, 
            last_restock_date = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `)
      .bind(quantity, productId)
      .run();
    } else if (type === 'out') {
      const currentInventory = await DB.prepare(
        'SELECT quantity FROM inventory WHERE product_id = ?'
      )
      .bind(productId)
      .first();
      
      if (!currentInventory || currentInventory.quantity < quantity) {
        await DB.prepare('ROLLBACK').run();
        return c.json({ error: 'Insufficient inventory' }, 400);
      }
      
      await DB.prepare(
        'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?'
      )
      .bind(quantity, productId)
      .run();
    } else if (type === 'adjust') {
      await DB.prepare(
        'UPDATE inventory SET quantity = ? WHERE product_id = ?'
      )
      .bind(quantity, productId)
      .run();
    }
    
    await DB.prepare('COMMIT').run();
    return c.json({ success: true });
  } catch (error) {
    await DB.prepare('ROLLBACK').run();
    return c.json({ error: 'Failed to update inventory' }, 500);
  }
});

// 用户行为分析API
app.get('/api/admin/analytics/users', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    // 用户统计
    const userStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login >= datetime('now', '-30 days') THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_users
      FROM users
    `).first();

    // 行为统计
    const behaviorStats = await DB.prepare(`
      SELECT 
        COUNT(CASE WHEN action_type = 'view' THEN 1 END) as total_views,
        COUNT(CASE WHEN action_type = 'search' THEN 1 END) as total_searches,
        COUNT(CASE WHEN action_type = 'cart' THEN 1 END) as total_cart_adds,
        COUNT(CASE WHEN action_type = 'purchase' THEN 1 END) as total_purchases
      FROM user_behaviors
      WHERE created_at >= datetime('now', '-30 days')
    `).first();

    // 热门搜索
    const topSearches = await DB.prepare(`
      SELECT keyword, COUNT(*) as count
      FROM search_history
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 10
    `).all();

    // 用户留存
    const retention = await DB.prepare(`
      WITH cohort AS (
        SELECT 
          date(created_at) as join_date,
          id
        FROM users
        WHERE created_at >= datetime('now', '-30 days')
      ),
      activity AS (
        SELECT 
          u.id,
          date(ub.created_at) as activity_date
        FROM users u
        JOIN user_behaviors ub ON u.id = ub.user_id
        WHERE ub.created_at >= datetime('now', '-30 days')
      )
      SELECT 
        c.join_date as date,
        COUNT(DISTINCT a.id) * 100.0 / COUNT(DISTINCT c.id) as retention
      FROM cohort c
      LEFT JOIN activity a ON c.id = a.id
      GROUP BY c.join_date
      ORDER BY c.join_date
    `).all();

    // 行为路径分析
    const behaviorFlow = await DB.prepare(`
      WITH next_actions AS (
        SELECT 
          ub1.action_type as current_action,
          ub2.action_type as next_action,
          COUNT(*) as transition_count
        FROM user_behaviors ub1
        LEFT JOIN user_behaviors ub2 ON 
          ub1.user_id = ub2.user_id AND
          ub2.created_at > ub1.created_at AND
          ub2.created_at <= datetime(ub1.created_at, '+1 hour')
        WHERE ub1.created_at >= datetime('now', '-30 days')
        GROUP BY ub1.action_type, ub2.action_type
      )
      SELECT 
        current_action as action,
        SUM(transition_count) as count,
        json_group_array(
          json_object(
            'action', next_action,
            'count', transition_count
          )
        ) as next_actions
      FROM next_actions
      GROUP BY current_action
      ORDER BY count DESC
    `).all();

    return c.json({
      userStats,
      behaviorStats,
      topSearches: topSearches.results,
      userRetention: retention.results,
      userBehaviorFlow: behaviorFlow.results.map(flow => ({
        ...flow,
        nextActions: JSON.parse(flow.next_actions).filter(na => na.action !== null),
      })),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// 批量导入API
app.post('/api/import/products', adminAuth, async (c) => {
  const { DB } = c.env;
  const file = await c.req.file('file');
  
  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400);
  }

  try {
    const text = await file.text();
    const rows = text.split('\n').slice(1); // 跳过标题行
    let imported = 0;
    let failed = 0;

    await DB.prepare('BEGIN TRANSACTION').run();

    for (const row of rows) {
      try {
        const [name, description, price, image, category_id] = row.split(',').map(field => field.trim());
        
        if (!name || !price) {
          failed++;
          continue;
        }

        await DB.prepare(`
          INSERT INTO products (name, description, price, image, category_id)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(name, description, parseFloat(price), image, category_id ? parseInt(category_id) : null)
        .run();

        imported++;
      } catch (error) {
        failed++;
      }
    }

    await DB.prepare('COMMIT').run();
    return c.json({ imported, failed });
  } catch (error) {
    await DB.prepare('ROLLBACK').run();
    return c.json({ error: 'Import failed' }, 500);
  }
});

app.post('/api/import/inventory', adminAuth, async (c) => {
  const { DB } = c.env;
  const file = await c.req.file('file');
  
  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400);
  }

  try {
    const text = await file.text();
    const rows = text.split('\n').slice(1);
    let imported = 0;
    let failed = 0;

    await DB.prepare('BEGIN TRANSACTION').run();

    for (const row of rows) {
      try {
        const [product_id, quantity, low_stock_threshold] = row.split(',').map(field => field.trim());
        
        if (!product_id || !quantity) {
          failed++;
          continue;
        }

        // 检查产品是否存在
        const product = await DB.prepare('SELECT id FROM products WHERE id = ?')
          .bind(parseInt(product_id))
          .first();

        if (!product) {
          failed++;
          continue;
        }

        // 更新或插入库存记录
        await DB.prepare(`
          INSERT INTO inventory (product_id, quantity, low_stock_threshold)
          VALUES (?, ?, ?)
          ON CONFLICT(product_id) DO UPDATE SET
            quantity = excluded.quantity,
            low_stock_threshold = excluded.low_stock_threshold,
            last_restock_date = CURRENT_TIMESTAMP
        `)
        .bind(
          parseInt(product_id),
          parseInt(quantity),
          low_stock_threshold ? parseInt(low_stock_threshold) : 10
        )
        .run();

        // 记录库存变更
        await DB.prepare(`
          INSERT INTO inventory_logs (product_id, quantity_change, type, reason)
          VALUES (?, ?, 'adjust', 'Bulk import')
        `)
        .bind(parseInt(product_id), parseInt(quantity))
        .run();

        imported++;
      } catch (error) {
        failed++;
      }
    }

    await DB.prepare('COMMIT').run();
    return c.json({ imported, failed });
  } catch (error) {
    await DB.prepare('ROLLBACK').run();
    return c.json({ error: 'Import failed' }, 500);
  }
});

// 报表API
app.get('/api/admin/reports', adminAuth, async (c) => {
  const { DB } = c.env;
  const range = c.req.query('range') || '30days';
  
  try {
    let dateFilter;
    switch (range) {
      case '7days':
        dateFilter = "datetime('now', '-7 days')";
        break;
      case '30days':
        dateFilter = "datetime('now', '-30 days')";
        break;
      case '12months':
        dateFilter = "datetime('now', '-12 months')";
        break;
      default:
        dateFilter = "datetime('now', '-30 days')";
    }

    // 分类销售统计
    const salesByCategory = await DB.prepare(`
      SELECT 
        c.name as category,
        SUM(oi.quantity * oi.price) as sales,
        ROUND(SUM(oi.quantity * oi.price) * 100.0 / (
          SELECT SUM(quantity * price)
          FROM order_items oi2
          JOIN orders o2 ON oi2.order_id = o2.id
          WHERE o2.created_at >= ${dateFilter}
            AND o2.status != 'cancelled'
        ), 2) as percentage
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.created_at >= ${dateFilter}
        AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY sales DESC
    `).all();

    // 时间维度销售统计
    const salesByTime = await DB.prepare(`
      SELECT 
        date(created_at) as date,
        SUM(total_amount) as sales,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= ${dateFilter}
        AND status != 'cancelled'
      GROUP BY date(created_at)
      ORDER BY date
    `).all();

    // 客户统计
    const customerStats = await DB.prepare(`
      WITH customer_orders AS (
        SELECT 
          user_id,
          COUNT(*) as order_count,
          AVG(total_amount) as avg_order_value
        FROM orders
        WHERE created_at >= ${dateFilter}
          AND status != 'cancelled'
        GROUP BY user_id
      )
      SELECT 
        COUNT(CASE WHEN order_count = 1 THEN 1 END) as new_customers,
        COUNT(CASE WHEN order_count > 1 THEN 1 END) as repeat_customers,
        AVG(avg_order_value) as average_order_value
      FROM customer_orders
    `).first();

    // 商品表现
    const productPerformance = await DB.prepare(`
      WITH product_stats AS (
        SELECT 
          p.id,
          p.name,
          COUNT(DISTINCT o.id) as order_count,
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.price) as revenue,
          COUNT(DISTINCT ub.id) as view_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
        LEFT JOIN user_behaviors ub ON p.id = ub.product_id 
          AND ub.action_type = 'view'
          AND ub.created_at >= ${dateFilter}
        WHERE (o.created_at >= ${dateFilter} OR o.created_at IS NULL)
        GROUP BY p.id
      )
      SELECT 
        id,
        name,
        total_sold as sales,
        revenue,
        view_count as views,
        CASE 
          WHEN view_count > 0 THEN CAST(order_count AS FLOAT) / view_count 
          ELSE 0 
        END as conversion_rate
      FROM product_stats
      ORDER BY revenue DESC
      LIMIT 10
    `).all();

    return c.json({
      salesByCategory: salesByCategory.results,
      salesByTime: salesByTime.results,
      customerStats: {
        newCustomers: customerStats.new_customers,
        repeatCustomers: customerStats.repeat_customers,
        averageOrderValue: customerStats.average_order_value,
      },
      productPerformance: productPerformance.results,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// 优惠券API
app.post('/api/admin/coupons', adminAuth, async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO coupons (code, type, value, min_purchase, start_date, end_date, usage_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      data.code,
      data.type,
      data.value,
      data.min_purchase,
      data.start_date,
      data.end_date,
      data.usage_limit
    )
    .run();
    
    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to create coupon' }, 500);
  }
});

// 营销活动API
app.post('/api/admin/campaigns', adminAuth, async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    await DB.prepare('BEGIN TRANSACTION').run();

    const result = await DB.prepare(`
      INSERT INTO campaigns (name, type, start_date, end_date, conditions, rewards, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      data.name,
      data.type,
      data.start_date,
      data.end_date,
      JSON.stringify(data.conditions),
      JSON.stringify(data.rewards),
      data.status
    )
    .run();

    if (data.products) {
      for (const product of data.products) {
        await DB.prepare(`
          INSERT INTO campaign_products (campaign_id, product_id, discount_price, stock_limit)
          VALUES (?, ?, ?, ?)
        `)
        .bind(result.lastRowId, product.id, product.discount_price, product.stock_limit)
        .run();
      }
    }

    await DB.prepare('COMMIT').run();
    return c.json({ id: result.lastRowId });
  } catch (error) {
    await DB.prepare('ROLLBACK').run();
    return c.json({ error: 'Failed to create campaign' }, 500);
  }
});

// 自动化规则API
app.post('/api/admin/automation-rules', adminAuth, async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO automation_rules (name, trigger_type, conditions, actions, status)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      data.name,
      data.trigger_type,
      JSON.stringify(data.conditions),
      JSON.stringify(data.actions),
      data.status
    )
    .run();
    
    return c.json({ id: result.lastRowId });
  } catch (error) {
    return c.json({ error: 'Failed to create automation rule' }, 500);
  }
});

// 优惠券使用API
app.post('/api/coupons/apply', auth(), async (c) => {
  const { DB } = c.env;
  const userId = c.get('jwtPayload').id;
  const { code, orderId } = await c.req.json();
  
  try {
    const coupon = await DB.prepare(`
      SELECT * FROM coupons 
      WHERE code = ? 
        AND (end_date IS NULL OR end_date >= datetime('now'))
        AND (usage_limit IS NULL OR used_count < usage_limit)
    `)
    .bind(code)
    .first();

    if (!coupon) {
      return c.json({ error: 'Invalid or expired coupon' }, 400);
    }

    // 检查是否已使用过
    const used = await DB.prepare(`
      SELECT id FROM user_coupons 
      WHERE user_id = ? AND coupon_id = ? AND used = TRUE
    `)
    .bind(userId, coupon.id)
    .first();

    if (used) {
      return c.json({ error: 'Coupon already used' }, 400);
    }

    // 创建用户优惠券记录
    await DB.prepare(`
      INSERT INTO user_coupons (user_id, coupon_id, used, used_at)
      VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)
    `)
    .bind(userId, coupon.id)
    .run();

    // 更新优惠券使用次数
    await DB.prepare(`
      UPDATE coupons 
      SET used_count = used_count + 1 
      WHERE id = ?
    `)
    .bind(coupon.id)
    .run();

    return c.json({ success: true, discount: coupon });
  } catch (error) {
    return c.json({ error: 'Failed to apply coupon' }, 500);
  }
});

// 执行自动化规则
app.post('/api/automation/execute', async (c) => {
  const { DB } = c.env;
  const { ruleId, userId, triggerData } = await c.req.json();
  
  try {
    const rule = await DB.prepare('SELECT * FROM automation_rules WHERE id = ?')
      .bind(ruleId)
      .first();

    if (!rule || rule.status !== 'active') {
      return c.json({ error: 'Rule not found or inactive' }, 400);
    }

    const conditions = JSON.parse(rule.conditions);
    const actions = JSON.parse(rule.actions);

    // 执行自动化动作
    let executionResult;
    switch (actions.type) {
      case 'send_coupon':
        executionResult = await createAndSendCoupon(DB, userId, actions.data);
        break;
      case 'add_points':
        executionResult = await addUserPoints(DB, userId, actions.data);
        break;
      // 添加其他自动化动作类型
    }

    // 记录执行结果
    await DB.prepare(`
      INSERT INTO automation_executions (rule_id, user_id, trigger_data, execution_result, status)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      ruleId,
      userId,
      JSON.stringify(triggerData),
      JSON.stringify(executionResult),
      'success'
    )
    .run();

    return c.json({ success: true, result: executionResult });
  } catch (error) {
    return c.json({ error: 'Failed to execute automation rule' }, 500);
  }
});

// 商品分析API
app.get('/api/admin/analytics/products', adminAuth, async (c) => {
  const { DB } = c.env;
  
  try {
    // 商品统计
    const productStats = await DB.prepare(`
      WITH product_metrics AS (
        SELECT 
          p.id,
          p.name,
          COUNT(DISTINCT CASE WHEN ub.action_type = 'view' THEN ub.id END) as views,
          COUNT(DISTINCT CASE WHEN ub.action_type = 'cart' THEN ub.id END) as cart_adds,
          COUNT(DISTINCT CASE WHEN ub.action_type = 'purchase' THEN ub.id END) as purchases,
          SUM(CASE WHEN ub.action_type = 'purchase' THEN oi.price * oi.quantity ELSE 0 END) as revenue
        FROM products p
        LEFT JOIN user_behaviors ub ON p.id = ub.product_id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        GROUP BY p.id
      )
      SELECT 
        id,
        name,
        views,
        cart_adds as cartAdds,
        purchases as sales,
        revenue,
        CASE 
          WHEN views > 0 THEN CAST(purchases AS FLOAT) / views 
          ELSE 0 
        END as conversion_rate
      FROM product_metrics
      ORDER BY revenue DESC
    `).all();

    // 分类表现
    const categoryPerformance = await DB.prepare(`
      SELECT 
        c.name as category,
        COUNT(DISTINCT p.id) as products,
        COUNT(DISTINCT oi.id) as sales,
        SUM(oi.price * oi.quantity) as revenue
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY c.id
      ORDER BY revenue DESC
    `).all();

    // 价格区间分析
    const priceRangeAnalysis = await DB.prepare(`
      WITH ranges AS (
        SELECT 
          CASE 
            WHEN price <= 100 THEN '¥0-100'
            WHEN price <= 500 THEN '¥101-500'
            ELSE '¥500以上'
          END as range,
          id
        FROM products
      )
      SELECT 
        r.range,
        COUNT(DISTINCT p.id) as products,
        COUNT(DISTINCT oi.id) as sales,
        SUM(oi.price * oi.quantity) as revenue
      FROM ranges r
      JOIN products p ON r.id = p.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY r.range
      ORDER BY MIN(p.price)
    `).all();

    // 浏���转化分析
    const viewToCartRate = await DB.prepare(`
      WITH product_views AS (
        SELECT 
          product_id,
          COUNT(*) as view_count
        FROM user_behaviors
        WHERE action_type = 'view'
        GROUP BY product_id
      ),
      product_carts AS (
        SELECT 
          product_id,
          COUNT(*) as cart_count
        FROM user_behaviors
        WHERE action_type = 'cart'
        GROUP BY product_id
      )
      SELECT 
        p.id as product_id,
        p.name,
        COALESCE(pv.view_count, 0) as views,
        COALESCE(pc.cart_count, 0) as cart_adds,
        CASE 
          WHEN pv.view_count > 0 
          THEN CAST(pc.cart_count AS FLOAT) / pv.view_count 
          ELSE 0 
        END as rate
      FROM products p
      LEFT JOIN product_views pv ON p.id = pv.product_id
      LEFT JOIN product_carts pc ON p.id = pc.product_id
      WHERE pv.view_count > 0
      ORDER BY rate DESC
      LIMIT 10
    `).all();

    return c.json({
      productStats: productStats.results,
      categoryPerformance: categoryPerformance.results,
      priceRangeAnalysis: priceRangeAnalysis.results,
      viewToCartRate: viewToCartRate.results,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch product analytics' }, 500);
  }
});

export default app; 