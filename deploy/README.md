# 部署指南

## 环境要求

- CentOS 8 / Ubuntu 22.04，2C4G+
- Node.js 18+
- pnpm
- PM2
- Nginx
- MySQL 8

## 部署步骤

### 1. 安装系统依赖

```bash
# Node.js (使用 nvm 或系统包管理)
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 18
npm install -g pnpm pm2

# MySQL 8
# Ubuntu: sudo apt install mysql-server
# CentOS: sudo dnf install mysql-server

# Nginx
# Ubuntu: sudo apt install nginx
# CentOS: sudo dnf install nginx
```

### 2. 配置数据库

```sql
CREATE DATABASE memory_space CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON memory_space.* TO 'ms_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 部署应用

```bash
# 克隆代码
cd /var/www
git clone <repo-url> memory-space
cd memory-space

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env 填入真实配置

# 安装 + 构建
pnpm install
cd backend && pnpm run build && cd ..
cd frontend && pnpm run build && cd ..

# 创建日志目录
sudo mkdir -p /var/log/memory-space

# 启动后端
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup
```

### 4. 配置 Nginx

```bash
# 复制 nginx 配置
sudo cp deploy/nginx.conf /etc/nginx/conf.d/memory-space.conf
# 修改 server_name 为你的域名
sudo nginx -t
sudo systemctl reload nginx
```

### 5. HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 6. 安全组

仅开放端口：22 / 80 / 443  
不对公网开放：3000 / 3306

## 后续更新

```bash
bash deploy/deploy.sh
```
