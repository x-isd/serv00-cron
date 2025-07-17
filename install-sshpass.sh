#!/bin/bash

# Koyeb平台sshpass安装脚本
# 在package.json的postinstall脚本中调用

echo "🔍 检查sshpass是否已安装..."

# 检查sshpass是否存在
if command -v sshpass &> /dev/null; then
    echo "✅ sshpass已安装"
    sshpass -V
    exit 0
fi

echo "❌ sshpass未找到，开始安装..."

# 检查系统类型
if [ -f /etc/debian_version ]; then
    echo "📦 检测到Debian/Ubuntu系统，使用apt安装..."
    
    # 更新包列表
    apt-get update -qq
    
    # 安装sshpass
    apt-get install -y sshpass
    
    if command -v sshpass &> /dev/null; then
        echo "✅ sshpass安装成功"
        sshpass -V
    else
        echo "❌ sshpass安装失败"
        exit 1
    fi
    
elif [ -f /etc/redhat-release ]; then
    echo "📦 检测到RedHat/CentOS系统，使用yum安装..."
    
    # 安装sshpass
    yum install -y sshpass
    
    if command -v sshpass &> /dev/null; then
        echo "✅ sshpass安装成功"
        sshpass -V
    else
        echo "❌ sshpass安装失败"
        exit 1
    fi
    
elif [ -f /etc/alpine-release ]; then
    echo "📦 检测到Alpine系统，使用apk安装..."
    
    # 更新包列表
    apk update
    
    # 安装sshpass
    apk add sshpass
    
    if command -v sshpass &> /dev/null; then
        echo "✅ sshpass安装成功"
        sshpass -V
    else
        echo "❌ sshpass安装失败"
        exit 1
    fi
    
else
    echo "⚠️ 未知系统类型，尝试通用安装方法..."
    
    # 尝试不同的包管理器
    if command -v apt-get &> /dev/null; then
        apt-get update -qq && apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        yum install -y sshpass
    elif command -v apk &> /dev/null; then
        apk update && apk add sshpass
    else
        echo "❌ 无法找到合适的包管理器"
        exit 1
    fi
fi

# 最终检查
if command -v sshpass &> /dev/null; then
    echo "🎉 sshpass安装完成！"
    sshpass -V
else
    echo "💥 sshpass安装失败，将使用ssh2库作为备用方案"
    exit 0  # 不要让构建失败，让应用使用ssh2库
fi