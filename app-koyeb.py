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

# 确保sshpass可用 - Koyeb环境自动安装
def ensure_sshpass():
    """确保sshpass命令可用，如果不可用则自动安装"""
    try:
        # 检查sshpass是否可用
        result = subprocess.run(['sshpass', '-V'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ sshpass已可用")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print("⚠️ sshpass不可用，尝试安装...")
    
    try:
        # 更新包列表
        print("📦 更新包列表...")
        subprocess.run(['apt-get', 'update'], check=True, timeout=60)
        
        # 安装sshpass
        print("🔧 安装sshpass...")
        subprocess.run(['apt-get', 'install', '-y', 'sshpass'], check=True, timeout=120)
        
        # 验证安装
        result = subprocess.run(['sshpass', '-V'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ sshpass安装成功")
            return True
        else:
            print("❌ sshpass安装失败")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ 安装sshpass时发生错误: {e}")
        return False
    except subprocess.TimeoutExpired:
        print("❌ 安装sshpass超时")
        return False

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
    
    # 应用启动时确保sshpass可用
    print("🔍 检查sshpass可用性...")
    sshpass_available = ensure_sshpass()
    
    if sshpass_available:
        print("✅ sshpass准备就绪，SSH功能可正常使用")
    else:
        print("⚠️ 警告: sshpass不可用，SSH功能可能无法正常工作")
        print("💡 建议: 检查系统权限或使用Docker方案")
    
    # 启动Flask服务
    port = int(os.environ.get('PORT', 8000))
    print(f"🌐 启动Flask服务，端口: {port}")
    app.run(host='0.0.0.0', port=port, debug=False)