# Memory Space - 双人记忆空间

一个专为情侣设计的私密空间应用，记录恋爱中的点点滴滴。

## 功能概览

- **悄悄话** - 实时聊天，支持图片/引用回复/表情，WebSocket 即时通讯
- **时间线** - 共享相册与回忆卡片，支持照片、视频、音频、文字、文件上传
- **恋爱清单** - 200+ 预设情侣愿望清单 + 自定义条目，双人独立打卡
- **情侣小游戏** - 真心话大冒险、甜蜜骰子、默契问答，游戏互动提升亲密度
- **纪念日** - 重要日期管理与倒计时提醒
- **个人中心** - 头像、空间设置、生日管理、恋爱度展示、Web Push 通知

## 技术栈

### 前端
- Vue 3 + Composition API + TypeScript
- Vue Router + Pinia 状态管理
- Tailwind CSS
- Lucide Icons
- Socket.IO Client (实时通讯)
- PWA (Service Worker + Web Push)

### 后端
- NestJS 10 + TypeScript
- TypeORM + MySQL
- Passport + JWT 鉴权
- Socket.IO (WebSocket 网关)
- @nestjs/schedule (定时任务)
- @nestjs/throttler (限流)
- Helmet (安全头)

### 部署
- PM2 进程管理
- Nginx 反向代理 + 静态资源托管
- 支持大文件上传 (250MB)

## 项目结构

```
AIcoding/
├── frontend/              # 前端 Vue 3 SPA
│   └── src/
│       ├── views/         # 页面组件
│       ├── components/    # 通用组件
│       ├── stores/        # Pinia 状态
│       ├── api/           # 接口封装
│       └── utils/         # 工具函数 (推送等)
├── backend/               # 后端 NestJS
│   └── src/
│       ├── modules/       # 业务模块
│       │   ├── auth/      # 登录注册 JWT
│       │   ├── user/      # 用户管理
│       │   ├── couple/    # 情侣空间 & 恋爱度
│       │   ├── chat/      # 实时聊天
│       │   ├── media/     # 时间线回忆
│       │   ├── anniversary/ # 纪念日
│       │   ├── bucket/    # 恋爱清单
│       │   ├── game/      # 情侣小游戏
│       │   ├── oss/       # 文件上传 & 签名
│       │   └── push/      # Web Push 通知
│       └── entities/      # TypeORM 实体
├── deploy/                # 部署配置
│   ├── ecosystem.config.js  # PM2 配置
│   ├── nginx.conf           # Nginx 配置
│   └── deploy.sh            # 部署脚本
├── scripts/               # 构建脚本
└── pnpm-workspace.yaml    # pnpm monorepo
```

## 本地开发

### 前置要求
- Node.js >= 18
- pnpm
- MySQL 8

### 启动

```bash
# 安装依赖
pnpm install

# 同时启动前后端 (前端 :5173, 后端 :3000)
pnpm dev

# 或分别启动
pnpm dev:frontend
pnpm dev:backend
```

### 环境变量 (后端)

在 `backend/` 下创建 `.env` 文件：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=memory_space
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
```

## 构建与部署

```bash
# 全量构建
pnpm build

# 生产启动 (需先配置 PM2)
pm2 start deploy/ecosystem.config.js
```

Nginx 配置参考 `deploy/nginx.conf`。

## 安全措施

- JWT 签名鉴权，接口限流
- 上传文件 MIME 白名单校验 + 签名 URL
- Helmet 安全响应头
- 用户上传资源强制 `Content-Disposition: attachment` 防 XSS
- 输入参数 DTO 白名单校验 (class-validator)
