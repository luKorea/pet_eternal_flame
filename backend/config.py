"""从环境变量读取配置，敏感信息不写进代码。开发/生产分离。"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# 环境：development 使用 SQLite，production 使用 MySQL
FLASK_ENV = os.getenv("FLASK_ENV", "development")
IS_PRODUCTION = FLASK_ENV == "production"

# MySQL（仅 production 或未配置 SQLite 时使用）
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "pet_eternal_flame")

# SQLite（development 默认，无需安装 MySQL）
_dir = Path(__file__).resolve().parent
SQLITE_PATH = os.getenv("SQLITE_PATH", str(_dir / "data" / "dev.db"))

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "168"))
