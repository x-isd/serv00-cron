# 服务器进程保活面板 - 简洁版

一个简洁高效的服务器进程保活管理系统，基于Cloudflare Workers构建。

## 🚀 特性

- ✅ **简洁设计** - 单文件Worker实现，无复杂架构
- ✅ **Web界面** - 现代化的响应式管理面板
- ✅ **服务器卡片** - 直观显示服务器信息和状态
- ✅ **命令执行** - 支持自定义命令和预设快捷操作
- ✅ **Telegram通知** - 自动发送执行结果通知
- ✅ **环境变量配置** - 安全的配置管理

## 📋 环境变量配置

在Cloudflare Workers中配置以下环境变量：

### 必需配置

```bash
# 服务器账户信息（JSON格式）
ACCOUNTS_JSON='[
  {
    "host": "your-server.com",
    "port": 22,
    "username": "your-username",
    "password": "your-password",
    "cron": "cd ~/nezhapanel && /home/kkkbob/.npm-global/bin/pm2 start ./dashboard"
  }
]'

# Telegram Bot配置
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 可选配置

```bash
# SSH代理服务URL（如果使用外部SSH代理）
SSH_PROXY_URL=https://your-ssh-proxy.herokuapp.com
```

## 🛠️ 部署步骤

### 1. 部署Cloudflare Workers

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 创建新的Worker
4. 复制 `worker.js` 内容到编辑器
5. 配置环境变量
6. 部署并获取域名

### 2. 部署SSH代理服务（可选）

如果需要真实的SSH连接功能，需要部署SSH代理服务：

#### 使用Railway部署

1. 创建新项目并连接GitHub仓库
2. 将 `ssh-proxy-simple.js` 重命名为 `index.js`
3. 将 `ssh-proxy-package.json` 重命名为 `package.json`
4. 部署并获取服务URL
5. 在Workers中配置 `SSH_PROXY_URL` 环境变量

#### 使用Render部署

1. 连接GitHub仓库
2. 选择Web Service
3. 构建命令：`npm install`
4. 启动命令：`npm start`
5. 部署并获取服务URL

#### 使用Heroku部署

```bash
# 创建Heroku应用
heroku create your-ssh-proxy

# 部署代码
git add .
git commit -m "Deploy SSH proxy"
git push heroku main
```

## 📱 使用说明

### 1. 访问面板

通过Cloudflare Workers提供的域名访问管理面板。

### 2. 服务器管理

- **查看服务器** - 自动显示配置的服务器卡片
- **执行命令** - 在输入框中输入命令并点击执行
- **快捷操作** - 使用预设按钮快速执行常用命令

### 3. 预设命令

- **启动服务** - 启动服务器进程
- **状态检查** - 查看PM2进程状态
- **重启服务** - 重启服务器进程
- **查看日志** - 显示最近20行日志

### 4. Telegram通知

执行命令后会自动发送结果到配置的Telegram群组。

## 🔧 配置示例

### ACCOUNTS_JSON格式

```json
[
  {
    "host": "server1.example.com",
    "port": 22,
    "username": "user1",
    "password": "password1",
    "cron": "cd ~/myapp && /home/user1/.npm-global/bin/pm2 start ./app"
  },
  {
    "host": "server2.example.com",
    "port": 2222,
    "username": "user2",
    "password": "password2",
    "cron": "cd ~/myservice && pm2 start server"
  }
]
```

### Telegram Bot设置

1. 与 [@BotFather](https://t.me/BotFather) 对话创建Bot
2. 获取Bot Token
3. 将Bot添加到群组并获取Chat ID
4. 配置环境变量

## 🚨 注意事项

### 安全建议

- ✅ 使用强密码
- ✅ 限制SSH访问IP
- ✅ 定期更换密码
- ✅ 使用SSH密钥认证（推荐）

### 限制说明

- Cloudflare Workers有执行时间限制（CPU时间10ms，总时间30s）
- 需要外部SSH代理服务处理长时间连接
- 模拟模式仅用于界面测试

## 🔄 升级说明

### 从复杂版本迁移

如果你之前使用了复杂的架构版本，可以：

1. 保留现有的环境变量配置
2. 替换Worker代码为简洁版本
3. 可选择保留或移除SSH代理服务

### 功能对比

| 功能 | 简洁版 | 复杂版 |
|------|--------|--------|
| 单文件部署 | ✅ | ❌ |
| Web界面 | ✅ | ✅ |
| SSH连接 | 外部代理 | 内置支持 |
| 测试覆盖 | 基础 | 完整 |
| 维护成本 | 低 | 高 |

## 📞 支持

- 问题反馈：[Telegram](https://t.me/yxjsjl)
- 项目地址：GitHub仓库链接

## 📄 许可证

MIT License - 自由使用和修改