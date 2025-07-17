#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Koyeb专用SSH代理服务
基于原始Python脚本，提供API接口，与原脚本100%兼容
"""

import subprocess
import json
import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

# Flask API服务
app = Flask(__name__)
CORS(app)

def execute_ssh_command(host, port, username, password, command):
    """
    使用sshpass执行SSH命令（与原始Python脚本完全相同的方式）
    """
    try:
        # 构建SSH命令（与原始脚本第64行完全相同）
        restore_command = f"sshpass -p '{password}' ssh -o StrictHostKeyChecking=no -p {port} {username}@{host} '{command}'"
        
        print(f"执行SSH命令: {username}@{host}:{port}")
        print(f"命令: {restore_command.replace(password, '[PASSWORD]')}")
        
        # 执行命令，设置30秒超时（与原脚本相同）
        result = subprocess.run(
            restore_command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print(f"SSH命令执行成功: {host}")
            return {
                'success': True,
                'output': result.stdout or '命令执行成功',
                'method': 'sshpass',
                'returncode': result.returncode
            }
        else:
            print(f"SSH命令执行失败: {host} - 退出码: {result.returncode}")
            return {
                'success': False,
                'error': result.stderr or f'命令执行失败，退出码: {result.returncode}',
                'method': 'sshpass',
                'returncode': result.returncode,
                'stdout': result.stdout
            }
            
    except subprocess.TimeoutExpired:
        print(f"SSH命令执行超时: {host}")
        return {
            'success': False,
            'error': 'SSH命令执行超时（30秒）',
            'method': 'sshpass'
        }
    except FileNotFoundError:
        print("sshpass命令未找到")
        return {
            'success': False,
            'error': 'sshpass命令未找到，请确保已安装sshpass',
            'method': 'sshpass'
        }
    except Exception as e:
        print(f"SSH命令执行异常: {str(e)}")
        return {
            'success': False,
            'error': f'SSH命令执行异常: {str(e)}',
            'method': 'sshpass'
        }

# Flask API路由
@app.route('/execute', methods=['POST'])
def api_execute():
    """SSH命令执行API接口"""
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'error': '请求数据为空'
        })
    
    # 验证必需参数
    required_fields = ['host', 'username', 'password', 'command']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
                'success': False,
                'error': f'缺少必要参数: {field}'
            })
    
    # 执行SSH命令
    result = execute_ssh_command(
        host=data['host'],
        port=data.get('port', 22),
        username=data['username'],
        password=data['password'],
        command=data['command']
    )
    
    return jsonify(result)

@app.route('/health', methods=['GET'])
def api_health():
    """健康检查API接口"""
    # 检查sshpass是否可用
    try:
        subprocess.run(['sshpass', '-V'], capture_output=True, check=True)
        sshpass_available = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        sshpass_available = False
    
    return jsonify({
        'status': 'ok',
        'service': 'SSH Proxy Python (Koyeb专用)',
        'method': 'sshpass',
        'sshpass_available': sshpass_available,
        'platform': 'koyeb',
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
    })

@app.route('/', methods=['GET'])
def api_root():
    """根路径信息"""
    # 检查sshpass是否可用
    try:
        subprocess.run(['sshpass', '-V'], capture_output=True, check=True)
        sshpass_available = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        sshpass_available = False
    
    return jsonify({
        'service': 'SSH Proxy Python Service (Koyeb专用)',
        'version': '1.2.0',
        'description': '基于原始Python脚本的SSH代理服务，与原脚本100%兼容',
        'endpoints': {
            '/execute': 'POST - 执行SSH命令',
            '/health': 'GET - 健康检查'
        },
        'method': 'sshpass',
        'platform': 'koyeb',
        'compatibility': '与原始recover_nezha.py脚本完全一致',
        'sshpass_available': sshpass_available
    })

if __name__ == "__main__":
    print("🚀 启动SSH代理服务 (Koyeb专用版)")
    print("📡 基于原始Python脚本，100%兼容")
    print("🔧 使用sshpass命令执行SSH连接")
    
    # 检查sshpass可用性
    try:
        result = subprocess.run(['sshpass', '-V'], capture_output=True, check=True)
        print("✅ sshpass命令可用")
        print(f"版本信息: {result.stderr.decode().strip()}")
    except FileNotFoundError:
        print("❌ sshpass命令未找到")
        print("请确保系统已安装sshpass")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ sshpass命令检查失败: {e}")
    
    # 启动Flask服务
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)