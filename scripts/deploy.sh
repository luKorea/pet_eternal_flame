#!/usr/bin/env bash
#
# 一键部署：将后端、C 端、运营后台部署到服务器，并配置 Nginx 反向代理。
# 使用前请配置 deploy.env 或 export 环境变量（见 scripts/deploy/deploy.env.example）。
#
# 用法:
#   ./scripts/deploy.sh
# 或先配置再执行:
#   cp scripts/deploy/deploy.env.example deploy.env
#   编辑 deploy.env 填入服务器与 MySQL 信息
#   ./scripts/deploy.sh
#

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 加载部署配置（优先 deploy.env，其次脚本同目录下的 deploy.env）
for f in "$ROOT/deploy.env" "$ROOT/scripts/deploy/deploy.env"; do
  if [ -f "$f" ]; then
    echo "加载配置: $f"
    set -a
    # shellcheck source=/dev/null
    source "$f"
    set +a
    break
  fi
done

DEPLOY_HOST="${DEPLOY_HOST:-118.193.46.228}"
DEPLOY_USER="${DEPLOY_USER:-root}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_DATABASE="${MYSQL_DATABASE:-pet_eternal_flame}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-korealu}"
JWT_SECRET="${JWT_SECRET:-change-me-in-production}"
NGINX_SERVER_NAME="${NGINX_SERVER_NAME:-$DEPLOY_HOST}"
APP_DIR="${DEPLOY_APP_DIR:-/opt/pet_eternal_flame}"

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
  echo "错误: 请设置 MYSQL_ROOT_PASSWORD（或 MYSQL_ROOT_PASSWORD）"
  exit 1
fi

# SSH 选项与命令：若设置了 DEPLOY_SSH_PASSWORD 且存在 sshpass 则使用密码登录
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"
if [ -n "$DEPLOY_SSH_PASSWORD" ] && command -v sshpass &>/dev/null; then
  export SSHPASS="$DEPLOY_SSH_PASSWORD"
  SSH_CMD="sshpass -e ssh $SSH_OPTS"
  RSYNC_SSH="sshpass -e ssh $SSH_OPTS"
else
  SSH_CMD="ssh $SSH_OPTS"
  RSYNC_SSH="ssh $SSH_OPTS"
fi

# 在本地先构建前端与运营后台，避免在服务器上跑 Node 构建导致内存爆满卡死
echo "[本地] 构建 C 端前端..."
(cd "$ROOT/frontend" && npm ci && npm run build)
echo "[本地] 构建运营后台..."
(cd "$ROOT/admin" && npm ci && VITE_BASE=/admin/ npm run build)

RSYNC_OPTS=(-az --delete \
  --exclude=node_modules --exclude=venv --exclude=.git --exclude=__pycache__ \
  --exclude=.env --exclude=backend/data --exclude="*.pyc" \
  -e "$RSYNC_SSH")

echo "目标: $DEPLOY_USER@$DEPLOY_HOST ($APP_DIR)"
echo "同步代码与构建产物..."
rsync "${RSYNC_OPTS[@]}" "$ROOT/" "$DEPLOY_USER@$DEPLOY_HOST:$APP_DIR/"

echo "在服务器执行安装与配置..."
$SSH_CMD "$DEPLOY_USER@$DEPLOY_HOST" "bash -s" \
  "$MYSQL_ROOT_PASSWORD" \
  "$JWT_SECRET" \
  "$MYSQL_USER" \
  "$MYSQL_DATABASE" \
  "$MYSQL_HOST" \
  "$NGINX_SERVER_NAME" \
  < "$ROOT/scripts/deploy/remote-setup.sh"

echo "全部完成。"
