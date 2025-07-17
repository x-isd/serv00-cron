// Node.js版SSH代理服务 - 使用sshpass命令（与原始Python脚本相同方式）
// 可以部署在Koyeb、Cyclic、Render等Node.js平台

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 转义Shell命令中的特殊字符
function escapeShellArg(arg) {
  return "'" + arg.replace(/'/g, "'\"'\"'") + "'";
}

// 使用sshpass执行SSH命令（与原始Python脚本相同的方式）
function executeSSHCommand(host, port, username, password, command) {
  return new Promise((resolve) => {
    // 构建SSH命令（与原始Python脚本完全相同）
    const escapedPassword = escapeShellArg(password);
    const escapedCommand = escapeShellArg(command);
    const sshCommand = `sshpass -p ${escapedPassword} ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} ${escapedCommand}`;
    
    console.log(`执行SSH命令: ${username}@${host}:${port}`);
    
    // 执行命令，设置30秒超时
    exec(sshCommand, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`SSH命令执行失败: ${host} - ${error.message}`);
        
        // 检查是否是超时错误
        if (error.killed && error.signal === 'SIGTERM') {
          resolve({
            success: false,
            error: 'SSH命令执行超时',
            method: 'sshpass'
          });
          return;
        }
        
        // 其他错误
        const errorOutput = stderr || error.message;
        resolve({
          success: false,
          error: `SSH命令执行失败: ${errorOutput}`,
          method: 'sshpass',
          exitCode: error.code
        });
        return;
      }
      
      // 执行成功
      console.log(`SSH命令执行成功: ${host}`);
      resolve({
        success: true,
        output: stdout || '命令执行成功',
        method: 'sshpass'
      });
    });
  });
}

// 使用ssh2库作为备用方案（原有实现）
function executeSSH2Command(host, port, username, password, command) {
  return new Promise((resolve) => {
    try {
      const { Client } = require('ssh2');
      const conn = new Client();
      
      conn.on('ready', () => {
        console.log(`SSH2连接成功: ${username}@${host}:${port}`);
        
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            resolve({
              success: false,
              error: `命令执行失败: ${err.message}`,
              method: 'ssh2'
            });
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
                method: 'ssh2',
                exitCode: code
              });
            } else {
              resolve({
                success: false,
                error: errorOutput || `命令执行失败，退出码: ${code}`,
                method: 'ssh2',
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
        resolve({
          success: false,
          error: `SSH2连接失败: ${err.message}`,
          method: 'ssh2'
        });
      });

      conn.connect({
        host: host,
        port: port || 22,
        username: username,
        password: password,
        readyTimeout: 10000
      });
      
    } catch (error) {
      resolve({
        success: false,
        error: `SSH2库错误: ${error.message}`,
        method: 'ssh2'
      });
    }
  });
}

// SSH命令执行接口
app.post('/execute', async (req, res) => {
  const { host, port, username, password, command, method } = req.body;
  
  if (!host || !username || !password || !command) {
    return res.json({
      success: false,
      error: '缺少必要参数: host, username, password, command'
    });
  }

  console.log(`收到SSH执行请求: ${username}@${host}:${port || 22}`);
  
  try {
    let result;
    
    // 根据方法选择执行方式，默认使用sshpass（推荐）
    if (method === 'ssh2') {
      result = await executeSSH2Command(host, port, username, password, command);
    } else {
      // 默认使用sshpass（与原始Python脚本相同）
      result = await executeSSHCommand(host, port, username, password, command);
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('处理请求异常:', error);
    res.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    });
  }
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'SSH Proxy Node.js (sshpass)',
    methods: ['sshpass', 'ssh2'],
    timestamp: new Date().toISOString() 
  });
});

// 根路径信息
app.get('/', (req, res) => {
  res.json({
    service: 'SSH Proxy Node.js Service',
    version: '2.0.0',
    description: '基于sshpass命令的SSH代理服务（与原始Python脚本相同方式）',
    endpoints: {
      '/execute': 'POST - 执行SSH命令',
      '/health': 'GET - 健康检查'
    },
    methods: {
      'sshpass': '使用sshpass命令行工具（推荐，与原脚本相同）',
      'ssh2': '使用ssh2 Node.js库（备用方案）'
    },
    usage: {
      'default': '默认使用sshpass方法',
      'specify_method': '在请求中添加 "method": "ssh2" 使用备用方案'
    }
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`SSH代理服务运行在端口 ${PORT}`);
  console.log('使用sshpass命令执行SSH连接（与原始Python脚本相同方式）');
});