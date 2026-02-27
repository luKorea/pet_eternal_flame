#!/usr/bin/env bash
# 同时启动后端与前端（后端后台运行，前端前台运行）

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 后端：需先有 venv
if [ ! -d "backend/venv" ]; then
  echo "请先创建后端虚拟环境: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi
# 确保后端依赖已安装（避免 ModuleNotFoundError: pymysql 等）
backend/venv/bin/pip install -r backend/requirements.txt -q 2>/dev/null || true

# 启动 Flask（后台）
echo "启动后端 (Flask :5001)..."
backend/venv/bin/python backend/app.py &
BACKEND_PID=$!

# 退出时杀掉后端
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT

# 等待后端就绪
for i in {1..15}; do
  if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5001/api/health 2>/dev/null | grep -q 200; then
    echo "后端已就绪"
    break
  fi
  sleep 0.5
done

# 前端：需先 npm install
if [ ! -d "frontend/node_modules" ]; then
  echo "请先安装前端依赖: cd frontend && npm install"
  exit 1
fi

echo "启动前端 (Vite :3000)..."
cd frontend && npm run dev
