// Deno版SSH代理服务
// 部署到 Deno Deploy: https://deno.com/deploy

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// 注意：Deno目前没有成熟的SSH2库，这里提供一个基于WebSocket的替代方案
// 实际使用时可能需要通过其他方式实现SSH连接

interface SSHRequest {
  host: string;
  port?: number;
  username: string;
  password: string;
  command: string;
}

interface SSHResponse {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
}

// CORS处理函数
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// 模拟SSH执行（实际部署时需要真实的SSH实现）
async function executeSSHCommand(req: SSHRequest): Promise<SSHResponse> {
  const { host, port = 22, username, password, command } = req;
  
  // 警告：这是一个模拟实现
  // 在Deno Deploy中，您需要：
  // 1. 使用WebSocket连接到一个SSH网关服务
  // 2. 或者使用HTTP API调用其他SSH服务
  // 3. 或者等待Deno生态中出现成熟的SSH库
  
  console.log(`模拟SSH连接: ${username}@${host}:${port}`);
  console.log(`执行命令: ${command}`);
  
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟不同命令的响应
  if (command.includes('whoami')) {
    return {
      success: true,
      output: username,
      exitCode: 0
    };
  } else if (command.includes('ps aux | grep nezha')) {
    return {
      success: true,
      output: `${username}  1234  0.1  0.5  12345  6789 ?  S  12:00  0:01 ./nezha-agent`,
      exitCode: 0
    };
  } else if (command.includes('systemctl')) {
    return {
      success: true,
      output: '服务操作完成',
      exitCode: 0
    };
  } else {
    return {
      success: true,
      output: `命令 "${command}" 执行完成（模拟结果）`,
      exitCode: 0
    };
  }
}

// 主要的请求处理函数
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;

  // 处理CORS预检请求
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }

  // 健康检查接口
  if (url.pathname === "/health" && method === "GET") {
    return new Response(
      JSON.stringify({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        platform: "Deno Deploy",
        note: "这是Deno版本的SSH代理服务"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      }
    );
  }

  // SSH执行接口
  if (url.pathname === "/execute" && method === "POST") {
    try {
      const body: SSHRequest = await req.json();
      
      // 验证必要参数
      if (!body.host || !body.username || !body.password || !body.command) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "缺少必要参数: host, username, password, command"
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(),
            },
          }
        );
      }

      // 执行SSH命令（模拟）
      const result = await executeSSHCommand(body);
      
      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(),
          },
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `请求处理失败: ${error.message}`
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(),
          },
        }
      );
    }
  }

  // 根路径信息
  if (url.pathname === "/" && method === "GET") {
    const info = `
<!DOCTYPE html>
<html>
<head>
    <title>Deno SSH代理服务</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin-top: 20px; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>🦕 Deno SSH代理服务</h1>
    
    <div class="warning">
        <h3>⚠️ 重要说明</h3>
        <p>这是一个<strong>模拟版本</strong>的SSH代理服务，运行在Deno Deploy平台上。</p>
        <p>由于Deno生态中缺乏成熟的SSH库，当前版本仅提供模拟响应。</p>
    </div>
    
    <div class="info">
        <h3>📡 API接口</h3>
        <ul>
            <li><code>GET /health</code> - 健康检查</li>
            <li><code>POST /execute</code> - SSH命令执行（模拟）</li>
        </ul>
        
        <h3>🔧 真实SSH实现建议</h3>
        <p>要实现真实的SSH功能，建议：</p>
        <ol>
            <li>使用Node.js版本的ssh-proxy-simple.js</li>
            <li>部署到支持Node.js的平台（如Cyclic、Koyeb）</li>
            <li>或等待Deno SSH库生态成熟</li>
        </ol>
    </div>
    
    <p><small>服务时间: ${new Date().toISOString()}</small></p>
</body>
</html>`;
    
    return new Response(info, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...corsHeaders(),
      },
    });
  }

  // 404处理
  return new Response(
    JSON.stringify({ error: "Not Found" }),
    {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    }
  );
}

// 启动服务
console.log("🦕 Deno SSH代理服务启动中...");
console.log("⚠️  注意：这是模拟版本，仅用于演示");

serve(handler, { port: 8000 });