#!/usr/bin/env bash
# 在服务器上运行：若数据库已建但缺少默认管理员或多语言数据，会补写。
# 用法: cd /opt/pet_eternal_flame/backend && bash scripts/seed-db.sh

set -e
cd "$(dirname "$0")/.."
echo "执行 init_db（会创建表若不存在，并写入默认管理员 admin/admin、多语言文案若为空）..."
./venv/bin/python -c "
from db import init_db
init_db()
print('完成。默认运营后台账号: admin / admin')
"
