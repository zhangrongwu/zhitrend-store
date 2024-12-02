import { Hono } from 'hono';
import { Env } from '../types/env';
import { auth } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// 获取订单列表
app.get('/api/orders', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');

  try {
    const orders = await DB.prepare(`
      SELECT 
        o.*,
        json_group_array(
          json_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).bind(user.id).all();

    // 解析items字符串为JSON
    const parsedOrders = orders.results.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));

    return c.json(parsedOrders);
  } catch (error) {
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// 获取订单详情
app.get('/api/orders/:id', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const orderId = c.req.param('id');

  try {
    const order = await DB.prepare(`
      SELECT 
        o.*,
        json_group_array(
          json_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ? AND o.user_id = ?
      GROUP BY o.id
    `).bind(orderId, user.id).first();

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // 解析items字符串为JSON
    order.items = JSON.parse(order.items);

    return c.json(order);
  } catch (error) {
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// 创建订单
app.post('/api/orders', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const { shippingAddress, contactPhone } = await c.req.json();

  try {
    // 开始事务
    await DB.prepare('BEGIN TRANSACTION').run();

    // 获取购物车商品
    const cartItems = await DB.prepare(`
      SELECT 
        ci.*,
        p.name,
        p.price,
        i.quantity as stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE ci.user_id = ?
    `).bind(user.id).all();

    if (cartItems.results.length === 0) {
      await DB.prepare('ROLLBACK').run();
      return c.json({ error: 'Cart is empty' }, 400);
    }

    // 检查库存
    for (const item of cartItems.results) {
      if (item.quantity > item.stock) {
        await DB.prepare('ROLLBACK').run();
        return c.json({ error: `${item.name} out of stock` }, 400);
      }
    }

    // 计算总金额
    const totalAmount = cartItems.results.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 创建订单
    const orderResult = await DB.prepare(`
      INSERT INTO orders (
        user_id, total_amount, shipping_address, contact_phone
      ) VALUES (?, ?, ?, ?)
    `).bind(
      user.id,
      totalAmount,
      shippingAddress,
      contactPhone
    ).run();

    // 创建订单项目
    for (const item of cartItems.results) {
      await DB.prepare(`
        INSERT INTO order_items (
          order_id, product_id, quantity, price
        ) VALUES (?, ?, ?, ?)
      `).bind(
        orderResult.lastRowId,
        item.product_id,
        item.quantity,
        item.price
      ).run();

      // 更新库存
      await DB.prepare(`
        UPDATE inventory 
        SET quantity = quantity - ?
        WHERE product_id = ?
      `).bind(item.quantity, item.product_id).run();
    }

    // 清空购物车
    await DB.prepare('DELETE FROM cart_items WHERE user_id = ?')
      .bind(user.id)
      .run();

    // 提交事务
    await DB.prepare('COMMIT').run();

    return c.json({ id: orderResult.lastRowId });
  } catch (error) {
    await DB.prepare('ROLLBACK').run();
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// 更新订单状态
app.put('/api/orders/:id/status', auth(), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const orderId = c.req.param('id');
  const { status } = await c.req.json();

  try {
    const result = await DB.prepare(`
      UPDATE orders 
      SET status = ?
      WHERE id = ? AND user_id = ?
    `).bind(status, orderId, user.id).run();

    if (result.changes === 0) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update order status' }, 500);
  }
});

export default app; 