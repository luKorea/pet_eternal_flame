#!/usr/bin/env bash
# 在服务器上执行：安装依赖、构建、配置 Nginx 与 systemd
# 参数: $1=MYSQL_ROOT_PASSWORD $2=JWT_SECRET $3=MYSQL_USER $4=MYSQL_DATABASE $5=MYSQL_HOST $6=NGINX_SERVER_NAME

set -e
APP_DIR=/opt/pet_eternal_flame
WWW_DIR=/var/www/pet_eternal_flame

MYSQL_ROOT_PASSWORD="$1"
JWT_SECRET="${2:-change-me-in-production}"
MYSQL_USER="${3:-root}"
MYSQL_DATABASE="${4:-pet_eternal_flame}"
MYSQL_HOST="${5:-127.0.0.1}"
NGINX_SERVER_NAME="${6:-_}"

detect_pkg_manager() {
  if command -v apt-get &>/dev/null; then
    echo "apt"
  elif command -v yum &>/dev/null; then
    echo "yum"
  elif command -v dnf &>/dev/null; then
    echo "dnf"
  else
    echo "none"
  fi
}

PKG_MANAGER="$(detect_pkg_manager)"

echo "[1/7] 安装系统依赖..."
case "$PKG_MANAGER" in
  apt)
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq nginx python3 python3-pip python3-venv mysql-client curl
    ;;
  yum|dnf)
    # 尽量不破坏已有环境，只安装必须组件
    $PKG_MANAGER install -y nginx python3 python3-pip curl || echo "  (安装部分依赖失败，请手动检查 nginx/python3/curl 是否已安装)"
    ;;
  *)
    echo "  未检测到 apt/yum/dnf，请手动安装 nginx、python3、pip、MySQL 客户端与 curl 后再运行本脚本。"
    exit 1
    ;;
esac

echo "[2/7] 创建 MySQL 数据库..."
if command -v mysql &>/dev/null; then
  mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || echo "  (若 MySQL 未安装或无法连接，请先安装并配置 MySQL)"
else
  echo "  未检测到 mysql 客户端，跳过创建数据库。请确认 MySQL 已安装并手动创建数据库：$MYSQL_DATABASE"
fi

echo "[3/7] 后端虚拟环境与依赖..."
cd "$APP_DIR/backend"
python3 -m venv venv
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q -r requirements.txt

echo "[4/7] 后端 .env..."
cat > "$APP_DIR/backend/.env" << ENV
FLASK_ENV=production
MYSQL_HOST=$MYSQL_HOST
MYSQL_PORT=3306
MYSQL_USER=$MYSQL_USER
MYSQL_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=$MYSQL_DATABASE
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE_HOURS=168
ENV

echo "[5/7] 初始化数据库表并写入默认管理员、多语言文案..."
if ! ./venv/bin/python -c "
from db import init_db
init_db()
print('DB init ok')
" 2>&1; then
  echo "  错误: 数据库初始化失败，请检查 MySQL 是否已启动、.env 中 MYSQL_* 是否正确。"
  exit 1
fi

echo "[5b/7] 校验后端能否正常加载（避免 Gunicorn Worker failed to boot）..."
if ! ./venv/bin/python -c "
from app import app
print('app load ok')
" 2>&1; then
  echo "  错误: 后端应用加载失败，请检查上方 traceback（常见原因：未安装 PyMySQL、MySQL 未启动或 .env 配置错误）。"
  exit 1
fi

echo "[6/7] 部署静态资源（使用本地已构建的 dist，不在服务器上跑 Node）..."
mkdir -p "$WWW_DIR"
if [ ! -d "$APP_DIR/frontend/dist" ] || [ ! -d "$APP_DIR/admin/dist" ]; then
  echo "  错误: 未找到 frontend/dist 或 admin/dist，请确保在本地执行 deploy.sh（会先本地构建再同步）。"
  exit 1
fi
cp -r "$APP_DIR/frontend/dist" "$WWW_DIR/frontend"
cp -r "$APP_DIR/admin/dist" "$WWW_DIR/admin"

echo "[7/7] Nginx 与 systemd..."
cp "$APP_DIR/scripts/deploy/pet-eternal-flame.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable pet-eternal-flame
systemctl restart pet-eternal-flame

# RHEL/CentOS 只读 conf.d/*.conf，没有 sites-available；用 8080 端口不影响你 80 上的 /video
NGINX_CONF="/etc/nginx/conf.d/pet-eternal-flame.conf"
if [ -d /etc/nginx/conf.d ]; then
  sed "s/__SERVER_NAME__/$NGINX_SERVER_NAME/g" "$APP_DIR/scripts/deploy/nginx-pet-8080.conf" > "$NGINX_CONF"
  if nginx -t 2>/dev/null; then
    if systemctl is-active --quiet nginx 2>/dev/null; then
      systemctl reload nginx
      echo "  Nginx 已加载 $NGINX_CONF 并 reload"
    else
      systemctl enable nginx 2>/dev/null
      systemctl start nginx
      echo "  Nginx 已启动并加载 $NGINX_CONF"
    fi
  else
    echo "  [警告] nginx -t 未通过，请检查 $NGINX_CONF 后执行: nginx -t && systemctl start nginx"
  fi
else
  sed "s/__SERVER_NAME__/$NGINX_SERVER_NAME/g" "$APP_DIR/scripts/deploy/nginx-pet-8080.conf" > /etc/nginx/sites-available/pet-eternal-flame
  echo "  已写入 /etc/nginx/sites-available/pet-eternal-flame，请手动启用并 systemctl reload nginx"
fi

echo
echo "部署完成。"
echo "  本项目使用 8080 端口，不影响你 80 端口上的 /video。"
echo "  C 端:    http://${NGINX_SERVER_NAME}:8080/"
echo "  运营后台: http://${NGINX_SERVER_NAME}:8080/admin/"
echo "  后端服务: systemctl status pet-eternal-flame"
echo "  静态目录: $WWW_DIR/frontend 与 $WWW_DIR/admin"
