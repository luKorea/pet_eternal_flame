"""数据库连接与用户表初始化。开发环境用 SQLite，生产环境用 MySQL。"""
import os
import json
import sqlite3
from contextlib import contextmanager

from config import (
    IS_PRODUCTION,
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    SQLITE_PATH,
)

if IS_PRODUCTION:
    import pymysql
    from pymysql.cursors import DictCursor


def _sqlite_connection():
    os.makedirs(os.path.dirname(SQLITE_PATH) or ".", exist_ok=True)
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row  # 使 row["col"] 可用
    return conn


def get_connection():
    """返回数据库连接。开发环境为 SQLite，生产为 MySQL。"""
    if IS_PRODUCTION:
        return pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            charset="utf8mb4",
            cursorclass=DictCursor,
        )
    return _sqlite_connection()


class _SqliteCursorAdapter:
    """让 SQLite 游标支持 %s 占位符（转为 ?），与 MySQL 写法一致。"""

    def __init__(self, conn):
        self._conn = conn
        self._cursor = conn.cursor()
        self.lastrowid = None

    def execute(self, sql, args=None):
        if args is None:
            args = ()
        sql = sql.replace("%s", "?")
        self._cursor.execute(sql, args)
        self.lastrowid = self._cursor.lastrowid
        return self._cursor

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self):
        rows = self._cursor.fetchall()
        return [dict(row) for row in rows]

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._cursor.close()


@contextmanager
def cursor(conn):
    """统一 cursor 接口：with cursor(conn) as cur: cur.execute(...); cur.fetchone(); cur.lastrowid"""
    if IS_PRODUCTION:
        with conn.cursor() as cur:
            yield cur
        return
    # SQLite: 包装成支持 %s 和 dict 行
    adapter = _SqliteCursorAdapter(conn)
    try:
        yield adapter
    finally:
        adapter._cursor.close()


def init_db():
    """创建 users 表。开发环境用 SQLite 文件，生产环境用 MySQL（并创建库）。"""
    if IS_PRODUCTION:
        _init_mysql()
    else:
        _init_sqlite()


def _project_root() -> str:
    """项目根目录（backend 的上一级）。"""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load_frontend_locales():
    """从 backend/locales 目录读取 zh/en 两份 JSON，返回 (zh_dict, en_dict)。"""
    root = _project_root()
    locales_dir = os.path.join(root, "backend", "locales")
    zh_path = os.path.join(locales_dir, "zh.json")
    en_path = os.path.join(locales_dir, "en.json")
    if not (os.path.exists(zh_path) and os.path.exists(en_path)):
        return None, None
    try:
        with open(zh_path, "r", encoding="utf-8") as f:
            zh = json.load(f)
        with open(en_path, "r", encoding="utf-8") as f:
            en = json.load(f)
        return zh, en
    except Exception:
        return None, None


def _flatten_locale(prefix, obj, out):
    """将嵌套的 locale 对象拍平成 key -> 文本，其中 key 形如 layout.title。"""
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_prefix = f"{prefix}.{k}" if prefix else k
            _flatten_locale(new_prefix, v, out)
    else:
        out[prefix] = str(obj)


def _seed_language_strings(conn):
    """
    如果 language_strings 为空，则将前端 C 端已有的 zh/en 文案同步到数据库中。
    只在表为空时执行一次，避免覆盖在线运营修改。
    """
    try:
        with cursor(conn) as cur:
            cur.execute("SELECT COUNT(*) AS cnt FROM language_strings")
            row = cur.fetchone()
            count = row["cnt"] if isinstance(row, dict) else (row[0] if row else 0)
    except Exception:
        return

    if count and count > 0:
        return

    zh, en = _load_frontend_locales()
    if not zh or not en:
        return

    zh_flat = {}
    en_flat = {}
    _flatten_locale("", zh, zh_flat)
    _flatten_locale("", en, en_flat)

    try:
        with cursor(conn) as cur:
            for key, zh_text in zh_flat.items():
                en_text = en_flat.get(key, zh_text)
                category = key.split(".")[0] if "." in key else "common"
                cur.execute(
                    """
                    INSERT INTO language_strings (`key`, zh, en, category)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (key, zh_text, en_text, category),
                )
        conn.commit()
    except Exception:
        # 出错不影响主流程
        conn.rollback()


def _init_sqlite():
    conn = _sqlite_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        # 管理员表，用于后台登录与角色控制
        conn.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'admin',
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        # 多语言字符串表，存储 C 端用户界面的中英文文案
        conn.execute("""
            CREATE TABLE IF NOT EXISTS language_strings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                zh TEXT NOT NULL,
                en TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'common',
                updated_at TEXT DEFAULT (datetime('now')),
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        # 计算请求日志（用于统计）
        conn.execute("""
            CREATE TABLE IF NOT EXISTS calculate_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                pet_name TEXT,
                death_date TEXT NOT NULL,
                locale TEXT NOT NULL DEFAULT 'zh',
                result_json TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        # 站点设置 key-value
        conn.execute("""
            CREATE TABLE IF NOT EXISTS site_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)
        # 公告/帮助
        conn.execute("""
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                locale TEXT NOT NULL DEFAULT 'zh',
                active INTEGER NOT NULL DEFAULT 1,
                start_at TEXT,
                end_at TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.commit()
        # 如果没有管理员账号，创建默认 admin/admin（开发用）
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as cnt FROM admins")
        row = cur.fetchone()
        if row and row[0] == 0:
            # 延迟导入以避免循环依赖
            from auth_utils import hash_password

            cur.execute(
                "INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)" if not IS_PRODUCTION else
                "INSERT INTO admins (username, password_hash, role) VALUES (%s, %s, %s)",
                ("admin", hash_password("admin"), "super"),
            )
            conn.commit()
        # 初始化 C 端多语言文案（仅在 language_strings 为空时）
        _seed_language_strings(conn)
    finally:
        conn.close()


def _init_mysql():
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        charset="utf8mb4",
    )
    try:
        with conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` DEFAULT CHARACTER SET utf8mb4")
        conn.commit()
    finally:
        conn.close()

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(64) NOT NULL UNIQUE,
                    password_hash VARCHAR(256) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # 管理员表
            cur.execute("""
                CREATE TABLE IF NOT EXISTS admins (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(64) NOT NULL UNIQUE,
                    password_hash VARCHAR(256) NOT NULL,
                    role VARCHAR(16) NOT NULL DEFAULT 'admin',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # 多语言字符串表，存储 C 端用户界面的中英文文案
            cur.execute("""
                CREATE TABLE IF NOT EXISTS language_strings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    `key` VARCHAR(255) NOT NULL UNIQUE,
                    zh LONGTEXT NOT NULL,
                    en LONGTEXT NOT NULL,
                    category VARCHAR(50) NOT NULL DEFAULT 'common',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS calculate_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    pet_name VARCHAR(128),
                    death_date DATE NOT NULL,
                    locale VARCHAR(16) NOT NULL DEFAULT 'zh',
                    result_json JSON,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS site_settings (
                    `key` VARCHAR(255) PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS announcements (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    body LONGTEXT NOT NULL,
                    locale VARCHAR(16) NOT NULL DEFAULT 'zh',
                    active TINYINT NOT NULL DEFAULT 1,
                    start_at DATETIME,
                    end_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
        conn.commit()
        # seed default admin if none
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as cnt FROM admins")
            cnt = cur.fetchone()[0]
            if cnt == 0:
                from auth_utils import hash_password
                cur.execute(
                    "INSERT INTO admins (username, password_hash, role) VALUES (%s, %s, %s)",
                    ("admin", hash_password("admin"), "super"),
                )
        conn.commit()
        # 初始化 C 端多语言文案（仅在 language_strings 为空时）
        _seed_language_strings(conn)
    finally:
        conn.close()
