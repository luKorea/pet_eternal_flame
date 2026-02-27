"""数据库连接与用户表初始化。开发环境用 SQLite，生产环境用 MySQL。"""
import os
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
        conn.commit()
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
        conn.commit()
    finally:
        conn.close()
