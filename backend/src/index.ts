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
    const users = await DB.prepare(
      'SELECT id, email, name, role, created_at FROM users'
    ).all();
    
    return c.json(users);
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.put('/api/admin/users/:id/role', adminAuth, async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('id');
  const { role } = await c.req.json();
  
  try {
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

export default app; 