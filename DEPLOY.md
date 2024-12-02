# 部署指南

## 前端部署 (Cloudflare Pages)

1. 登录 Cloudflare Dashboard
2. 进入 Pages 页面
3. 创建新项目
4. 连接 Git 仓库
5. 配置构建设置：
   ```
   构建命令: npm run build
   构建输出目录: dist
   ```
6. 环境变量设置：
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```

## 后端部署 (Cloudflare Workers)

1. 配置 wrangler.toml：
   ```toml
   name = "backend"
   main = "src/index.ts"
   compatibility_date = "2023-01-01"
   node_compat = true

   [[d1_databases]]
   binding = "DB"
   database_name = "shop"
   database_id = "your-database-id"

   [[r2_buckets]]
   binding = "R2"
   bucket_name = "shop-uploads"

   [vars]
   JWT_SECRET = "your-jwt-secret"
   ```

2. 创建 D1 数据库：
   ```bash
   wrangler d1 create shop
   ```

3. 创建 R2 存储桶：
   ```bash
   wrangler r2 bucket create shop-uploads
   ```

4. 初始化数据库：
   ```bash
   wrangler d1 execute shop --file=./schema.sql
   ```

5. 部署：
   ```bash
   npm run deploy
   ```

## 域名配置

1. 在 Cloudflare DNS 中添加记录：
   ```
   Type  Name     Content              Proxy status
   A     api      workers.dev          Proxied
   A     www      pages.dev           Proxied
   ```

2. 配置自定义域名：
   - 前端: 在 Pages 项目设置中添加自定义域名
   - 后端: 在 Workers 设置中添加自定义域名

## SSL/TLS 配置

1. 在 Cloudflare SSL/TLS 设置中选择 "Full (strict)"
2. 确保所有请求都通过 HTTPS

## 监控和日志

1. 设置 Workers 分析：
   - 启用请求分析
   - 配置错误通知

2. 配置 Pages 分析：
   - 启用性能分析
   - 配置错误跟踪

## 性能优化

1. 配置 Cloudflare 缓存规则：
   ```
   Cache-Control: public, max-age=3600
   ```

2. 启用 Cloudflare 自动压缩

## 安全设置

1. 配置 WAF 规则
2. 启用 Rate Limiting
3. 设置 CORS 策略

## 备份策略

1. 数据库备份：
   ```bash
   wrangler d1 backup shop
   ```

2. R2 存储备份：
   ```bash
   wrangler r2 backup shop-uploads
   ```

## 故障恢复

1. 数据库恢复：
   ```bash
   wrangler d1 restore shop backup.sql
   ```

2. R2 存储恢复：
   ```bash
   wrangler r2 restore shop-uploads backup.tar
   ```

## 维护模式

1. 创建维护页面
2. 配置 Workers 路由规则以启用维护模式

## 监控检查清单

- [ ] 数据库连接状态
- [ ] API 响应时间
- [ ] 错误率监控
- [ ] 存储使用情况
- [ ] 流量监控
- [ ] 性能指标 