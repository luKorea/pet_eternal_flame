#!/usr/bin/env bash
# 在服务器上运行，用于排查后端 Worker failed to boot：
#   cd /opt/pet_eternal_flame/backend && bash scripts/check-app.sh

set -e
cd "$(dirname "$0")/.."
echo "=== 检查 Python 与 venv ==="
./venv/bin/python --version
echo ""
echo "=== 检查 PyMySQL 是否已安装 ==="
./venv/bin/python -c "import pymysql; print('PyMySQL OK')" || echo "PyMySQL 未安装，请运行: ./venv/bin/pip install -r requirements.txt"
echo ""
echo "=== 检查 .env 是否存在 ==="
test -f .env && echo ".env 存在" || echo ".env 不存在！"
echo ""
echo "=== 尝试加载应用（若失败会打印完整 traceback）==="
./venv/bin/python -c "
try:
    from app import app
    print('应用加载成功')
except Exception as e:
    import traceback
    print('应用加载失败:')
    traceback.print_exc()
"
