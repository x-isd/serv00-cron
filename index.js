// 简化版SSH代理服务 - 用于Cloudflare Workers调用
// 可以部署在任何支持Node.js的平台（如Railway、Render、Heroku等）

const express = require('express');
const { Client } = require('ssh2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// SSH命令执行接口
app.post('/execute', async (req, res) => {
  const { host, port, username, password, command } = req.body;
  
  if (!host || !username || !password || !command) {
    return res.json({
      success: false,
      error: '缺少必要参数'
    });
  }

  const conn = new Client();
  
  try {
    const result = await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log(`SSH连接成功: ${username}@${host}:${port}`);
        
        conn.exec(command, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          let output = '';
          let errorOutput = '';

          stream.on('close', (code, signal) => {
            conn.end();
            
            if (code === 0) {
              resolve({
                success: true,
                output: output || '命令执行成功',
                exitCode: code
              });
            } else {
              resolve({
                success: false,
                error: errorOutput || `命令执行失败，退出码: ${code}`,
                exitCode: code
              });
            }
          });

          stream.on('data', (data) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });
        });
      });

      conn.on('error', (err) => {
        reject(err);
      });

      conn.connect({
        host: host,
        port: port || 22,
        username: username,
        password: password,
        readyTimeout: 10000
      });
    });

    res.json(result);

  } catch (error) {
    console.error('SSH执行错误:', error);
    res.json({
      success: false,
      error: `SSH连接失败: ${error.message}`
    });
  }
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`SSH代理服务运行在端口 ${PORT}`);
});

// package.json内容（需要单独创建）
const packageJson = {
  "name": "ssh-proxy-simple",
  "version": "1.0.0",
  "description": "Simple SSH proxy for Cloudflare Workers",
  "main": "ssh-proxy-simple.js",
  "scripts": {
    "start": "node ssh-proxy-simple.js",
    "dev": "nodemon ssh-proxy-simple.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ssh2": "^1.14.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
};

console.log('创建package.json文件:');
console.log(JSON.stringify(packageJson, null, 2));
