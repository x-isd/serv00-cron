# 🚀 服务器进程保活面板 - 部署指南

## 📋 项目概述

一个基于Cloudflare Workers的简洁高效服务器进程保活管理系统，支持多服务器管理、SSH命令执行和Telegram通知。

## 🎯 快速部署步骤

### 第一步：部署Cloudflare Workers

#### 方法一：Dashboard部署（推荐新手）

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击 **Create application** → **Create Worker**
4. 给Worker命名（如：`server-keepalive-panel`）
5. 复制 [`worker.js`](worker.js:1) 的完整内容
6. 粘贴到编辑器中，替换默认代码
7. 点击 **Save and Deploy**
8. 记录分配的域名（如：`your-worker.your-subdomain.workers.dev`）

#### 方法二：Wrangler CLI部署（推荐开发者）

```bash
# 安装Wrangler CLI
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 复制配置文件
cp wrangler-simple.toml wrangler.toml

# 编辑wrangler.toml，修改name字段
# name = "server-keepalive-panel"

# 部署
wrangler deploy
```

### 第二步：配置环境变量

在Cloudflare Workers Dashboard中：

1. 进入你的Worker
2. 点击 **Settings** → **Variables**
3. 添加以下**必需**环境变量：

#### 必需配置

```bash
# 服务器账户信息（JSON格式）
ACCOUNTS_JSON = [{"host":"your-server.com","port":22,"username":"user","password":"pass","cron":"cd ~/myapp && pm2 start app"}]

# Telegram Bot配置
TELEGRAM_BOT_TOKEN = your_bot_token_here
TELEGRAM_CHAT_ID = your_chat_id_here
```

#### 可选配置

```bash
# SSH代理服务URL（如果需要真实SSH功能）
SSH_PROXY_URL = https://your-ssh-proxy.cyclic.app
```

### 第三步：部署SSH代理服务（可选但推荐）

> ⚠️ **重要说明**：没有SSH代理服务，命令执行将只显示模拟结果，无法真正连接服务器！

#### 🥇 推荐：Cyclic部署（完全免费，不休眠）

1. 访问 [Cyclic](https://cyclic.sh/)
2. 使用GitHub账户登录
3. 点击 **Deploy**
4. 选择 **Link Your Own** → **Link Github Repo**
5. 创建新仓库或选择现有仓库
6. 上传以下文件：
   - 将 [`ssh-proxy-simple.js`](ssh-proxy-simple.js:1) 重命名为 `index.js`
   - 将 [`ssh-proxy-package.json`](ssh-proxy-package.json:1) 重命名为 `package.json`
7. Cyclic会自动检测并部署
8. 获取分配的域名（如：`https://your-app.cyclic.app`）
9. 在Workers中添加环境变量：`SSH_PROXY_URL = https://your-app.cyclic.app`

#### 🥈 备选：Koyeb部署（免费计划，全球CDN）

1. 访问 [Koyeb](https://koyeb.com/)
2. 创建免费账户
3. 点击 **Create App**
4. 选择 **Deploy from GitHub**
5. 连接仓库并配置：
   - Build command: `npm install`
   - Run command: `npm start`
6. 部署并获取域名

#### 🥉 备选：Render部署（免费但会休眠）

1. 访问 [Render](https://render.com/)
2. 创建 **Web Service**
3. 连接GitHub仓库
4. 配置：
   - Build Command: `npm install`
   - Start Command: `npm start`
5. 部署并获取URL
6. ⚠️ **注意**：免费版15分钟无活动会休眠，需要配置定时ping

#### ❌ 不支持的平台

- **Vercel**: 不支持长时间运行的服务器
- **Netlify**: 仅支持静态网站和短时间函数
- **Railway**: 不再完全免费
- **Heroku**: 已取消免费计划

## 🔧 详细配置说明

### ACCOUNTS_JSON格式

```json
[
  {
    "host": "server1.example.com",
    "port": 22,
    "username": "root",
    "password": "your_password",
    "cron": "cd ~/myapp && pm2 start app.js"
  },
  {
    "host": "192.168.1.100",
    "port": 2222,
    "username": "admin",
    "password": "admin_password",
    "cron": "cd ~/myservice && systemctl restart myservice"
  }
]
```

**字段说明**：
- `host`: 服务器地址
- `port`: SSH端口（默认22）
- `username`: SSH用户名
- `password`: SSH密码
- `cron`: 进程保活命令（根据你的实际服务调整）

### Telegram Bot设置

#### 创建Bot

1. 与 [@BotFather](https://t.me/BotFather) 对话
2. 发送 `/newbot`
3. 设置Bot名称：`Server Keepalive Bot`
4. 设置用户名：`your_keepalive_bot`
5. 获取Token（格式：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

#### 获取Chat ID

**方法一：群组使用**
1. 创建Telegram群组
2. 将Bot添加到群组
3. 在群组中发送任意消息
4. 访问：`https://api.telegram.org/bot<TOKEN>/getUpdates`
5. 查找 `"chat":{"id":-1001234567890}` 中的ID

**方法二：私聊使用**
1. 与Bot私聊发送 `/start`
2. 访问上述URL
3. 查找正数的chat ID

## ✅ 测试部署

### 1. 基础功能测试

1. **访问面板**：打开Workers域名
2. **界面检查**：确认服务器卡片正确显示
3. **模拟测试**：点击"状态检查"按钮（无SSH代理时显示模拟结果）

### 2. SSH代理测试

如果配置了SSH代理，测试真实连接：

```bash
# 测试SSH代理健康状态
curl https://your-ssh-proxy.cyclic.app/health

# 测试SSH连接
curl -X POST https://your-ssh-proxy.cyclic.app/execute \
  -H "Content-Type: application/json" \
  -d '{
    "host": "your-server.com",
    "port": 22,
    "username": "your-user",
    "password": "your-pass",
    "command": "whoami"
  }'
```

### 3. Telegram通知测试

```bash
# 测试Telegram Bot
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
     -H "Content-Type: application/json" \
     -d '{"chat_id":"<CHAT_ID>","text":"测试消息"}'
```

## 🔄 功能使用说明

### 预设命令

- **启动服务** - 执行配置的cron命令启动进程
- **状态检查** - 查看PM2或系统进程状态
- **重启服务** - 重启服务器进程
- **查看日志** - 显示最近的服务日志

### 自定义命令

在命令输入框中输入任意Linux命令，如：
- `ps aux | grep myapp`
- `systemctl status nginx`
- `tail -n 20 /var/log/myapp.log`
- `df -h`

## 🚨 故障排除

### 常见问题

#### 问题1：服务器卡片不显示
**解决方案**：
- 检查 `ACCOUNTS_JSON` 格式是否为有效JSON
- 确认环境变量已正确保存
- 刷新页面重试

#### 问题2：命令执行显示"模拟执行"
**原因**：未配置SSH代理服务
**解决方案**：
- 部署SSH代理服务（推荐Cyclic）
- 配置 `SSH_PROXY_URL` 环境变量

#### 问题3：SSH连接失败
**检查项**：
- 服务器地址和端口是否正确
- 用户名密码是否正确
- 服务器是否允许SSH连接
- SSH代理服务是否正常运行

#### 问题4：Telegram通知不工作
**检查项**：
- Bot Token格式是否正确
- Chat ID是否正确（注意正负号）
- Bot是否已添加到群组
- 群组中Bot是否有发送消息权限

### 调试方法

#### 查看Workers日志
```bash
# 实时查看日志
wrangler tail

# 或在Dashboard中查看Analytics
```

#### 检查SSH代理状态
```bash
# 健康检查
curl https://your-ssh-proxy.cyclic.app/health

# 查看平台日志（Cyclic/Koyeb/Render控制台）
```

## 🔒 安全建议

### 服务器安全
- ✅ 使用强密码或SSH密钥
- ✅ 限制SSH访问IP范围
- ✅ 定期更换密码
- ✅ 启用防火墙和fail2ban

### 配置安全
- ✅ 不要在代码中硬编码密码
- ✅ 使用Cloudflare环境变量存储敏感信息
- ✅ 定期备份配置
- ✅ 限制Telegram Bot权限

## 📊 监控和维护

### 性能监控
- Cloudflare Dashboard查看请求统计
- 监控Workers执行时间和错误率
- SSH代理服务的响应时间

### 定期维护
- 检查服务器进程状态
- 更新服务器软件和安全补丁
- 清理日志文件
- 备份重要数据

## 🆙 更新部署

### 更新Workers代码
1. 修改 `worker.js`
2. 在Dashboard中粘贴新代码，或使用 `wrangler deploy`
3. 测试功能是否正常

### 更新SSH代理
根据使用的平台，推送代码到仓库即可自动重新部署。

## 🆘 获取帮助

- **问题反馈**：[Telegram](https://t.me/yxjsjl)
- **查看文档**：[`README.md`](README.md:1)
- **平台对比**：[`SSH代理部署平台对比.md`](SSH代理部署平台对比.md:1)
- **重要说明**：[`部署说明-重要.md`](部署说明-重要.md:1)

---

**祝您部署顺利！如有问题，请参考故障排除部分或联系技术支持。**