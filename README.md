# 电商系统

一个基于 React + Cloudflare Workers 的现代电商系统。初创公司/个人独立站最好的组合

## 功能特点

### 用户端
- 商品浏览和搜索
- 购物车管理
- 订单管理
- 商品评价
- 收藏夹
- 个人中心

### 管理端
- 商品管理
- 库存管理
- 订单管理
- 营销活动
- 数据分析
- 用户管理

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- Headless UI
- Hero Icons

### 后端
- Cloudflare Workers
- Hono
- D1 (SQLite)
- R2 Storage

## 开始使用

### 前置要求
- Node.js 16+
- npm 7+
- Cloudflare 账号

### 安装步骤

1. 克隆项目 

2. 安装前端依赖
cd frontend
npm install
3. 安装后端依赖
cd backend
npm install

4. 配置环境变量
- 复制 `backend/wrangler.toml.example` 为 `backend/wrangler.toml`
- 更新配置文件中的必要信息：
  - D1 数据库 ID
  - R2 存储桶名称
  - JWT 密钥

5. 初始化数据库
cd backend
npm run db:migrate

6. 启动开发服务器

前端：
cd frontend
npm run dev

后端：
cd backend
npm run dev

## 项目结构
.
├── frontend/ # 前端项目
│ ├── src/
│ │ ├── components/ # 可复用组件
│ │ ├── pages/ # 页面组件
│ │ ├── hooks/ # 自定义 Hooks
│ │ └── utils/ # 工具函数
│ └── public/ # 静态资源
│
└── backend/ # 后端项目
├── src/
│ ├── middleware/ # 中间件
│ ├── utils/ # 工具函数
│ └── index.ts # 入口文件
└── schema.sql # 数据库模式

## API 文档

### 认证 API
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/login` - 用户登录

### 商品 API
- GET `/api/products` - 获取商品列表
- GET `/api/products/:id` - 获取商品详情
- POST `/api/products` - 创建商品
- PUT `/api/products/:id` - 更新商品
- DELETE `/api/products/:id` - 删除商品

### 购物车 API
- GET `/api/cart` - 获取购物车
- POST `/api/cart` - 添加商品到购物车
- PUT `/api/cart/:id` - 更新购物车商品
- DELETE `/api/cart/:id` - 删除购物车商品

### 订单 API
- GET `/api/orders` - 获取订单列表
- GET `/api/orders/:id` - 获取订单详情
- POST `/api/orders` - 创建订单
- PUT `/api/orders/:id` - 更新订单状态

### 管理 API
- GET `/api/admin/stats` - 获取统计数据
- GET `/api/admin/users` - 获取用户列表
- GET `/api/admin/analytics` - 获取分析数据

## 部署

1. 构建前端
cd frontend
npm run build

2. 部署后端
cd backend
npm run deploy

3. 部署前端
- 将 `frontend/dist` 目录部署到静态托管服务
- 或部署到 Cloudflare Pages

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

email: zhitrend@gmail.com

[公司主页](https://zhitrend.us.kg)