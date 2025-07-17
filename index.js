// Node.js版SSH代理服务 - 纯sshpass版本
// 适用于Koyeb Aptfile + Buildpack方案，需要系统安装sshpass

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 全局变量：sshpass可用性检测结果
let sshpassAvailable = null;

// 检测sshpass是否可用
function checkSshpassAvailability() {
  return new Promise((resolve) => {
    exec('which sshpass', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ sshpass不可用，请确保已正确安装sshpass');
        resolve(false);
      } else {
        console.log('✅ sshpass可用，使用sshpass命令执行SSH连接');
        resolve(true);
      }
    });
  });
}

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
    
    console.log(`执行SSH命令 (sshpass): ${username}@${host}:${port}`);
    
    // 执行命令，设置30秒超时
    exec(sshCommand, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`SSH命令执行失败: ${host} - ${error.message}`);
        
        // 检查是否是sshpass不存在的错误
        if (error.message.includes('sshpass: not found') || error.message.includes('command not found')) {
          resolve({
            success: false,
            error: 'sshpass命令不可用',
            method: 'sshpass',
            fallbackNeeded: true
          });
          return;
        }
        
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

// 纯sshpass版本 - 不使用ssh2库
// 适用于Aptfile + Buildpack方案

// SSH命令执行接口 - 纯sshpass版本
app.post('/execute', async (req, res) => {
  const { host, port, username, password, command } = req.body;
  
  if (!host || !username || !password || !command) {
    return res.json({
      success: false,
      error: '缺少必要参数: host, username, password, command'
    });
  }

  console.log(`收到SSH执行请求: ${username}@${host}:${port || 22}`);
  
  try {
    // 首次检测sshpass可用性（缓存结果）
    if (sshpassAvailable === null) {
      sshpassAvailable = await checkSshpassAvailability();
    }
    
    if (!sshpassAvailable) {
      return res.json({
        success: false,
        error: 'sshpass命令不可用，请确保已正确安装sshpass',
        method: 'sshpass'
      });
    }
    
    // 使用sshpass执行SSH命令
    const result = await executeSSHCommand(host, port, username, password, command);
    res.json(result);
    
  } catch (error) {
    console.error('处理请求异常:', error);
    res.json({
      success: false,
      error: `服务器内部错误: ${error.message}`,
      method: 'sshpass'
    });
  }
});

// 健康检查接口
app.get('/health', async (req, res) => {
  // 检测sshpass可用性
  if (sshpassAvailable === null) {
    sshpassAvailable = await checkSshpassAvailability();
  }
  
  res.json({
    status: 'ok',
    service: 'SSH Proxy Node.js (纯sshpass版本)',
    method: 'sshpass',
    sshpassAvailable: sshpassAvailable,
    timestamp: new Date().toISOString()
  });
});

// 根路径信息
app.get('/', async (req, res) => {
  // 检测sshpass可用性
  if (sshpassAvailable === null) {
    sshpassAvailable = await checkSshpassAvailability();
  }
  
  res.json({
    service: 'SSH Proxy Node.js Service',
    version: '2.2.0',
    description: '纯sshpass SSH代理服务 - 使用sshpass命令（与原脚本完全相同）',
    endpoints: {
      '/execute': 'POST - 执行SSH命令',
      '/health': 'GET - 健康检查'
    },
    method: {
      'sshpass': '使用sshpass命令行工具（与原Python脚本相同方式）'
    },
    currentStatus: {
      'sshpassAvailable': sshpassAvailable,
      'method': 'sshpass'
    },
    requirements: {
      'system': '需要系统安装sshpass命令',
      'deployment': '适用于Koyeb Aptfile + Buildpack方案'
    }
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`SSH代理服务运行在端口 ${PORT}`);
  console.log('纯sshpass版本 - 使用sshpass命令执行SSH连接（与原始Python脚本完全相同）');
  console.log('适用于Koyeb Aptfile + Buildpack方案');
});