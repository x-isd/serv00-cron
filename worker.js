// Nezha进程保活面板系统 - Cloudflare Workers版本
// 简洁的单文件实现，包含前端界面和后端逻辑

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// 主页HTML模板
const mainPageHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nezha进程保活面板</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .servers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .server-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .server-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
        
        .server-info {
            margin-bottom: 15px;
        }
        
        .server-title {
            font-size: 1.3rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }
        
        .server-details {
            color: #666;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .command-section {
            margin-bottom: 15px;
        }
        
        .command-input {
            width: 100%;
            padding: 10px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 0.9rem;
            transition: border-color 0.3s ease;
        }
        
        .command-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .btn {
            flex: 1;
            padding: 10px 15px;
            border: none;
            border-radius: 6px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5a6fd8;
        }
        
        .btn-secondary {
            background: #f8f9fa;
            color: #333;
            border: 1px solid #dee2e6;
        }
        
        .btn-secondary:hover {
            background: #e9ecef;
        }
        
        .result-section {
            margin-top: 15px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #667eea;
            display: none;
        }
        
        .result-section.show {
            display: block;
        }
        
        .result-section.success {
            background: #d4edda;
            border-left-color: #28a745;
            color: #155724;
        }
        
        .result-section.error {
            background: #f8d7da;
            border-left-color: #dc3545;
            color: #721c24;
        }
        
        .result-section pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            margin: 0;
        }
        
        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .footer {
            text-align: center;
            color: white;
            opacity: 0.8;
            margin-top: 40px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
        }
        
        .status-online {
            background: #28a745;
        }
        
        .status-offline {
            background: #dc3545;
        }
        
        .status-unknown {
            background: #ffc107;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Nezha进程保活面板</h1>
            <p>简洁高效的服务器进程管理工具</p>
        </div>
        
        <div id="servers-container" class="servers-grid">
            <!-- 服务器卡片将通过JavaScript动态生成 -->
        </div>
        
        <div class="footer">
            <p>Powered by Cloudflare Workers | 简洁版本</p>
        </div>
    </div>

    <script>
        // 默认命令配置
        const DEFAULT_COMMANDS = {
            nezha: 'cd ~/nezhapanel && /home/kkkbob/.npm-global/bin/pm2 start ./dashboard',
            status: 'cd ~/nezhapanel && /home/kkkbob/.npm-global/bin/pm2 status',
            restart: 'cd ~/nezhapanel && /home/kkkbob/.npm-global/bin/pm2 restart dashboard',
            logs: 'cd ~/nezhapanel && /home/kkkbob/.npm-global/bin/pm2 logs dashboard --lines 20'
        };

        // 页面加载时获取服务器列表
        document.addEventListener('DOMContentLoaded', function() {
            loadServers();
        });

        // 加载服务器列表
        async function loadServers() {
            try {
                const response = await fetch('/api/servers');
                const data = await response.json();
                
                if (data.success) {
                    renderServers(data.servers);
                } else {
                    showError('加载服务器列表失败: ' + data.error);
                }
            } catch (error) {
                showError('网络错误: ' + error.message);
            }
        }

        // 渲染服务器卡片
        function renderServers(servers) {
            const container = document.getElementById('servers-container');
            container.innerHTML = '';

            servers.forEach((server, index) => {
                const card = createServerCard(server, index);
                container.appendChild(card);
            });
        }

        // 创建服务器卡片
        function createServerCard(server, index) {
            const card = document.createElement('div');
            card.className = 'server-card';
            card.innerHTML = \`
                <div class="server-info">
                    <div class="server-title">
                        <span class="status-indicator status-unknown"></span>
                        \${server.username}@\${server.host}
                    </div>
                    <div class="server-details">
                        端口: \${server.port}<br>
                        主机: \${server.host}
                    </div>
                </div>
                
                <div class="command-section">
                    <input type="text" 
                           class="command-input" 
                           id="command-\${index}"
                           placeholder="输入要执行的命令..."
                           value="\${server.cron || DEFAULT_COMMANDS.nezha}">
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="executeCommand(\${index}, 'custom')">
                        <span id="loading-\${index}" style="display: none;" class="loading"></span>
                        执行命令
                    </button>
                    <button class="btn btn-secondary" onclick="executeCommand(\${index}, 'status')">
                        状态检查
                    </button>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-secondary" onclick="setCommand(\${index}, 'nezha')">
                        启动Nezha
                    </button>
                    <button class="btn btn-secondary" onclick="setCommand(\${index}, 'restart')">
                        重启服务
                    </button>
                    <button class="btn btn-secondary" onclick="setCommand(\${index}, 'logs')">
                        查看日志
                    </button>
                </div>
                
                <div id="result-\${index}" class="result-section">
                    <pre id="result-text-\${index}"></pre>
                </div>
            \`;
            return card;
        }

        // 设置预定义命令
        function setCommand(serverIndex, commandType) {
            const input = document.getElementById(\`command-\${serverIndex}\`);
            input.value = DEFAULT_COMMANDS[commandType] || '';
        }

        // 执行命令
        async function executeCommand(serverIndex, type) {
            const commandInput = document.getElementById(\`command-\${serverIndex}\`);
            const loadingEl = document.getElementById(\`loading-\${serverIndex}\`);
            const resultEl = document.getElementById(\`result-\${serverIndex}\`);
            const resultTextEl = document.getElementById(\`result-text-\${serverIndex}\`);

            let command = commandInput.value.trim();
            
            // 如果是预定义命令类型，使用对应的命令
            if (type !== 'custom') {
                command = DEFAULT_COMMANDS[type] || command;
                commandInput.value = command;
            }

            if (!command) {
                showResult(serverIndex, '请输入要执行的命令', 'error');
                return;
            }

            // 显示加载状态
            loadingEl.style.display = 'inline-block';
            resultEl.className = 'result-section show';
            resultTextEl.textContent = '正在执行命令...';

            try {
                const response = await fetch('/api/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        serverIndex: serverIndex,
                        command: command
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    showResult(serverIndex, data.output, 'success');
                } else {
                    showResult(serverIndex, data.error, 'error');
                }
            } catch (error) {
                showResult(serverIndex, '网络错误: ' + error.message, 'error');
            } finally {
                loadingEl.style.display = 'none';
            }
        }

        // 显示执行结果
        function showResult(serverIndex, text, type) {
            const resultEl = document.getElementById(\`result-\${serverIndex}\`);
            const resultTextEl = document.getElementById(\`result-text-\${serverIndex}\`);
            
            resultEl.className = \`result-section show \${type}\`;
            resultTextEl.textContent = text;
        }

        // 显示错误信息
        function showError(message) {
            const container = document.getElementById('servers-container');
            container.innerHTML = \`
                <div class="server-card">
                    <div class="result-section show error">
                        <pre>\${message}</pre>
                    </div>
                </div>
            \`;
        }
    </script>
</body>
</html>
`;

// 处理请求的主函数
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 路由处理
  if (path === '/') {
    return new Response(mainPageHTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  if (path === '/api/servers') {
    return handleGetServers();
  }
  
  if (path === '/api/execute' && request.method === 'POST') {
    return handleExecuteCommand(request);
  }

  // 404处理
  return new Response('Not Found', { status: 404 });
}

// 获取服务器列表
async function handleGetServers() {
  try {
    const accountsJson = await getEnvVar('ACCOUNTS_JSON');
    
    if (!accountsJson) {
      return jsonResponse({
        success: false,
        error: '未配置ACCOUNTS_JSON环境变量'
      });
    }

    const servers = JSON.parse(accountsJson);
    
    return jsonResponse({
      success: true,
      servers: servers
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'ACCOUNTS_JSON格式错误: ' + error.message
    });
  }
}

// 执行SSH命令
async function handleExecuteCommand(request) {
  try {
    const { serverIndex, command } = await request.json();
    
    // 获取环境变量
    const accountsJson = await getEnvVar('ACCOUNTS_JSON');
    const telegramToken = await getEnvVar('TELEGRAM_BOT_TOKEN');
    const telegramChatId = await getEnvVar('TELEGRAM_CHAT_ID');
    
    if (!accountsJson) {
      return jsonResponse({
        success: false,
        error: '未配置ACCOUNTS_JSON环境变量'
      });
    }

    const servers = JSON.parse(accountsJson);
    const server = servers[serverIndex];
    
    if (!server) {
      return jsonResponse({
        success: false,
        error: '服务器索引无效'
      });
    }

    // 执行SSH命令 (这里需要使用外部SSH代理服务)
    const result = await executeSSHCommand(server, command);
    
    // 发送Telegram通知
    if (telegramToken && telegramChatId) {
      const message = `🖥️ 服务器: ${server.host}\\n📝 命令: ${command}\\n${result.success ? '✅' : '❌'} 结果:\\n${result.output || result.error}`;
      await sendTelegramMessage(telegramToken, telegramChatId, message);
    }
    
    return jsonResponse(result);
    
  } catch (error) {
    return jsonResponse({
      success: false,
      error: '请求处理失败: ' + error.message
    });
  }
}

// 执行SSH命令 - 需要外部SSH代理服务才能真实执行
async function executeSSHCommand(server, command) {
  try {
    // ⚠️ 重要: Cloudflare Workers无法直接进行SSH连接
    // 必须配置SSH_PROXY_URL环境变量指向外部SSH代理服务
    
    const sshProxyUrl = await getEnvVar('SSH_PROXY_URL');
    
    if (sshProxyUrl) {
      // 真实SSH执行 - 调用外部SSH代理服务
      console.log(`正在通过SSH代理执行命令: ${command}`);
      
      const response = await fetch(sshProxyUrl + '/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Nezha-Panel/1.0'
        },
        body: JSON.stringify({
          host: server.host,
          port: server.port,
          username: server.username,
          password: server.password,
          command: command
        }),
        timeout: 30000 // 30秒超时
      });
      
      if (!response.ok) {
        throw new Error(`SSH代理服务响应错误: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('SSH执行结果:', result);
      return result;
    }
    
    // ❌ 未配置SSH代理 - 返回警告信息
    return {
      success: false,
      error: `⚠️ 未配置SSH代理服务！
      
命令无法在真实服务器上执行。

要启用真实SSH功能，请：
1. 部署SSH代理服务 (ssh-proxy-simple.js)
2. 在Workers环境变量中设置 SSH_PROXY_URL
3. 例如: SSH_PROXY_URL=https://your-ssh-proxy.herokuapp.com

当前命令: ${command}
目标服务器: ${server.host}:${server.port}

详细部署指南请查看 deploy-guide.md`
    };
    
  } catch (error) {
    return {
      success: false,
      error: `SSH执行失败: ${error.message}

可能的原因:
1. SSH代理服务不可用
2. 网络连接问题
3. 服务器认证失败
4. 命令执行超时

请检查SSH代理服务状态和配置`
    };
  }
}

// 发送Telegram消息
async function sendTelegramMessage(token, chatId, message) {
  try {
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: "问题反馈❓", url: "https://t.me/yxjsjl" }
        ]]
      }
    };

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Telegram发送结果:', result);
    
    return result.ok;
  } catch (error) {
    console.error('Telegram发送失败:', error);
    return false;
  }
}

// 获取环境变量
async function getEnvVar(name) {
  // 在Cloudflare Workers中，环境变量通过全局对象访问
  return globalThis[name] || '';
}

// 返回JSON响应
function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}