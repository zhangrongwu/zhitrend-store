const API_BASE_URL = 'http://localhost:8787';

interface RequestConfig extends RequestInit {
  token?: string;
  data?: any;
}

async function request(endpoint: string, { token, data, ...customConfig }: RequestConfig = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (response.ok) {
      return responseData;
    } else {
      throw new Error(responseData.error || 'API request failed');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const api = {
  // 认证相关
  login: (data: { email: string; password: string }) => 
    request('/api/auth/login', { method: 'POST', data }),
  
  register: (data: { email: string; password: string; name: string }) =>
    request('/api/auth/register', { method: 'POST', data }),

  // 商品相关
  getProducts: () => request('/api/products'),
  getProduct: (id: string) => request(`/api/products/${id}`),
  createProduct: (data: any, token: string) =>
    request('/api/products', { method: 'POST', data, token }),
  updateProduct: (id: string, data: any, token: string) =>
    request(`/api/products/${id}`, { method: 'PUT', data, token }),
  deleteProduct: (id: string, token: string) =>
    request(`/api/products/${id}`, { method: 'DELETE', token }),

  // 购物车相关
  getCart: (token: string) => 
    request('/api/cart', { token }),
  addToCart: (data: { productId: number; quantity: number }, token: string) =>
    request('/api/cart', { method: 'POST', data, token }),
  updateCartItem: (id: string, data: { quantity: number }, token: string) =>
    request(`/api/cart/${id}`, { method: 'PUT', data, token }),
  removeFromCart: (id: string, token: string) =>
    request(`/api/cart/${id}`, { method: 'DELETE', token }),

  // 订单相关
  getOrders: (token: string) =>
    request('/api/orders', { token }),
  getOrder: (id: string, token: string) =>
    request(`/api/orders/${id}`, { token }),
  createOrder: (data: any, token: string) =>
    request('/api/orders', { method: 'POST', data, token }),
  updateOrder: (id: string, data: any, token: string) =>
    request(`/api/orders/${id}`, { method: 'PUT', data, token }),

  // 用户相关
  getProfile: (token: string) =>
    request('/api/profile', { token }),
  updateProfile: (data: any, token: string) =>
    request('/api/profile', { method: 'PUT', data, token }),
}; 