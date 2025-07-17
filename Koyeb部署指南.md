# Koyeb部署指南 - SSH代理服务

## 🎯 针对Koyeb平台的专门解决方案

由于您在Koyeb上遇到了`sshpass: not found`错误，这里提供专门的解决方案。

## 🔧 问题分析

Koyeb可能在某些情况下没有预装sshpass，或者环境发生了变化。我们的解决方案包括：

1. **自动安装脚本**：在部署时自动安装sshpass
2. **智能回退机制**：如果安装失败，自动使用ssh2库
3. **详细日志**：清晰显示安装和执行过程

## 📁 必需文件

确保您的项目包含以下文件：

```
├── index.js                 # 主服务文件（已更新为智能版本）
├── package.json             # 包含postinstall脚本
├── package-lock.json        # 锁定依赖版本
└── install-sshpass.sh       # sshpass自动安装脚本
```

## 🚀 部署步骤

### 1. 准备文件

确保所有文件都已更新：
- ✅ `index.js` - 智能SSH代理服务
- ✅ `package.json` - 包含postinstall脚本
- ✅ `install-sshpass.sh` - 自动安装脚本

### 2. 生成package-lock.json

```bash
npm install --package-lock-only
```

### 3. 推送到GitHub

```bash
git add .
git commit -m "添加sshpass自动安装功能"
git push
```

### 4. Koyeb部署配置

1. **登录Koyeb控制台**：https://app.koyeb.com/
2. **创建新应用**：点击 "Create App"
3. **选择部署方式**：选择 "Deploy from GitHub"
4. **连接仓库**：选择您的GitHub仓库
5. **配置服务类型**：
   - ✅ **Service type**: Web service（重要！）
   - ❌ 不要选择Worker类型
6. **构建配置**：
   - **Build command**: `npm install`
   - **Run command**: `npm start`
   - **Port**: `8000`（或使用环境变量PORT）

### 5. 环境变量（可选）

如果需要调试，可以添加：
```
DEBUG=true
NODE_ENV=production
```

## 🔍 部署过程监控

### 查看构建日志

在Koyeb控制台中，您可以看到：

1. **npm install阶段**：
   ```
   > ssh-proxy-sshpass@2.0.0 postinstall
   > chmod +x install-sshpass.sh && ./install-sshpass.sh
   
   🔍 检查sshpass是否已安装...
   ❌ sshpass未找到，开始安装...
   📦 检测到Debian/Ubuntu系统，使用apt安装...
   ✅ sshpass安装成功
   ```

2. **应用启动阶段**：
   ```
   SSH代理服务运行在端口 8000
   ✅ sshpass可用，将优先使用sshpass命令
   ```

### 验证部署

部署完成后，访问健康检查：
```bash
curl https://your-app-name.koyeb.app/health
```

**期望响应**：
```json
{
  "status": "ok",
  "service": "SSH Proxy Node.js (智能选择)",
  "sshpassAvailable": true,
  "primaryMethod": "sshpass",
  "fallbackMethod": "ssh2"
}
```

## 🛠️ 故障排除

### 情况1：sshpass安装成功
- ✅ 日志显示"sshpass安装成功"
- ✅ 健康检查显示`"sshpassAvailable": true`
- ✅ SSH命令使用sshpass执行

### 情况2：sshpass安装失败，自动回退
- ⚠️ 日志显示"sshpass安装失败，将使用ssh2库作为备用方案"
- ✅ 健康检查显示`"sshpassAvailable": false`
- ✅ SSH命令使用ssh2库执行

### 情况3：权限问题
如果遇到权限错误：
```bash
chmod: cannot access 'install-sshpass.sh': Permission denied
```

**解决方案**：确保脚本文件已提交到Git仓库，并且有执行权限。

### 情况4：包管理器问题
如果遇到apt-get错误：
```bash
E: Unable to locate package sshpass
```

**解决方案**：脚本会自动尝试不同的包管理器，最终回退到ssh2库。

## 🔄 重新部署

如果需要重新部署：

1. **触发重新构建**：在Koyeb控制台点击 "Redeploy"
2. **查看新的构建日志**：确认sshpass安装过程
3. **测试功能**：访问健康检查和执行SSH命令

## 📊 预期结果

### 成功场景（sshpass可用）
```bash
# 健康检查
curl https://your-app.koyeb.app/health
# 响应：sshpassAvailable: true, primaryMethod: "sshpass"

# SSH命令执行
curl -X POST https://your-app.koyeb.app/execute \
  -H "Content-Type: application/json" \
  -d '{"host":"your-server.com","username":"user","password":"pass","command":"whoami"}'
# 响应：success: true, method: "sshpass"
```

### 回退场景（sshpass不可用）
```bash
# 健康检查
curl https://your-app.koyeb.app/health
# 响应：sshpassAvailable: false, primaryMethod: "ssh2"

# SSH命令执行
curl -X POST https://your-app.koyeb.app/execute \
  -H "Content-Type: application/json" \
  -d '{"host":"your-server.com","username":"user","password":"pass","command":"whoami"}'
# 响应：success: true, method: "ssh2", sshpassUnavailable: true
```

## 🎉 总结

现在的解决方案具备：
- ✅ **自动安装**：部署时自动尝试安装sshpass
- ✅ **智能回退**：安装失败时自动使用ssh2库
- ✅ **详细日志**：清晰显示每个步骤的执行情况
- ✅ **状态反馈**：API响应包含实际使用的方法
- ✅ **零配置**：用户无需手动干预

无论Koyeb环境如何变化，您的SSH代理服务都能正常工作！