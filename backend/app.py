"""
Pet Eternal Flame - 宠物永恒之焰
Flask API: 根据宠物死亡日期计算焚烧时间与数量（玄学规则），支持中英 locale 与翻译
"""
from datetime import datetime, date
from typing import List, Tuple

from flask import Flask, request, jsonify
from flask_cors import CORS

from translate_zh_en import translate_zh_to_en, translate_zh_to_en_batch
from db import get_connection, init_db, cursor
from auth_utils import hash_password, verify_password, encode_token, decode_token
from config import IS_PRODUCTION

try:
    import pymysql
except ImportError:
    pymysql = None

app = Flask(__name__)
CORS(
    app,
    origins=["*"],
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    supports_credentials=False,
)

# 吉日（每月推荐焚烧的日期，避开 4、9 等不吉日）
LUCKY_DAY_OFFSETS = [1, 6, 8, 15, 18, 28]  # 含满月 15

# 吉数（优先用于焚烧数量）
LUCKY_NUMBERS = [3, 6, 7, 8]

# 不吉数，需映射到最近吉数
UNLUCKY_NUMBERS = {4, 9}

# 接口错误文案（按 locale 返回，扩展语言时在此补充；缺失时回退 zh）
ERRORS: dict = {
    "deathDate_required": {"zh": "请提供死亡日期 deathDate (YYYY-MM-DD)", "en": "Please provide deathDate (YYYY-MM-DD)."},
    "deathDate_invalid": {"zh": "死亡日期格式无效，请使用 YYYY-MM-DD", "en": "Invalid deathDate format. Use YYYY-MM-DD."},
    "deathDate_future": {"zh": "请选择已过去的日期", "en": "Please select a date in the past."},
    "auth_username_password_required": {"zh": "请填写用户名和密码", "en": "Username and password are required."},
    "auth_username_taken": {"zh": "用户名已被使用", "en": "Username already taken."},
    "auth_invalid_credentials": {"zh": "用户名或密码错误", "en": "Invalid username or password."},
    "auth_unauthorized": {"zh": "请先登录", "en": "Please log in first."},
    "auth_db_unavailable": {"zh": "服务暂不可用，请稍后再试", "en": "Service temporarily unavailable. Please try again later."},
}

# 后端支持的 locale：用于归一化请求中的 locale，扩展时在此增加
SUPPORTED_LOCALES = ("zh", "en")
# 需要从中文翻译的 locale（使用 deep-translator 等），其余返回中文
TRANSLATABLE_LOCALES = ("en",)
DEFAULT_LOCALE = "zh"


def get_pet_months(death_date: date, today: date) -> int:
    """从死亡日到今日经过的完整月数（宠物月 = 人年）。"""
    if death_date > today:
        return 0
    months = (today.year - death_date.year) * 12 + (today.month - death_date.month)
    if today.day < death_date.day:
        months -= 1
    return max(0, months)


def get_lucky_quantity_raw(day: int, month: int, pet_months: int) -> int:
    """基于死亡日期的数理得到基础数量（可能为不吉数）。"""
    # 简单数理: (日 + 月) % 10 得 0-9，再结合宠物月数
    base = (day + month + pet_months) % 10
    if base == 0:
        base = 10
    return base


def to_lucky_quantity(raw: int) -> int:
    """将数量调整为最近吉数，避免 4、9。"""
    if raw in UNLUCKY_NUMBERS:
        # 4 -> 3 或 5，取 3；9 -> 8 或 10，取 8
        if raw == 4:
            return 3
        return 8
    if raw in LUCKY_NUMBERS:
        return raw
    # 其他数映射到最近吉数
    best = LUCKY_NUMBERS[0]
    for n in LUCKY_NUMBERS:
        if abs(n - raw) < abs(best - raw):
            best = n
    return best


def _normalize_locale(raw: str) -> str:
    """将请求中的 locale 归一化为 SUPPORTED_LOCALES 之一；扩展语言时在 SUPPORTED_LOCALES 增加即可。"""
    if not raw:
        return DEFAULT_LOCALE
    raw = raw.strip().split("-")[0].lower()
    if raw in SUPPORTED_LOCALES:
        return raw
    for supported in SUPPORTED_LOCALES:
        if raw.startswith(supported) or supported.startswith(raw):
            return supported
    return DEFAULT_LOCALE


def _get_locale(data: dict) -> str:
    """从请求体或 Accept-Language 取 locale 并归一化。"""
    loc = (data.get("locale") or request.headers.get("Accept-Language", "") or "").strip().lower()
    if loc:
        loc = loc.split(",")[0].strip().split("-")[0].lower()
    return _normalize_locale(loc) if loc else DEFAULT_LOCALE


def _error_message(key: str, locale: str) -> str:
    """按 locale 返回错误文案，无该语言时回退 zh。"""
    messages = ERRORS.get(key, {})
    return messages.get(locale) or messages.get("zh", "")


def _expand_language_rows(rows, field: str) -> dict:
    """将 language_strings 中的扁平 key（如 layout.title）展开为嵌套对象，方便 C 端直接作为 i18n 资源使用。"""
    root: dict = {}
    for r in rows:
        key = r.get("key") or r.get("`key`") or r.get("KEY") or r.get("Key")
        if not key:
            continue
        value = r.get(field)
        if value is None:
            continue
        parts = str(key).split(".")
        d = root
        for p in parts[:-1]:
            if p not in d or not isinstance(d[p], dict):
                d[p] = {}
            d = d[p]
        d[parts[-1]] = value
    return root


def get_burning_dates(
    death_date: date, today: date, count: int = 6
) -> List[Tuple[str, str]]:
    """
    生成建议焚烧日期列表：从本月/下月起，每月取吉日，避开与死亡日「冲」的日期。
    返回 [(日期, 说明), ...]
    """
    death_day = death_date.day
    # 冲日：与死亡日同「个位」的日期慎用，这里用「日数字相同」为冲，替换为相邻吉日
    avoid_days = {death_day, (death_day + 10) if death_day < 20 else death_day - 10}

    result = []
    # 从当前月开始，取接下来 count 个月的吉日
    year, month = today.year, today.month
    for _ in range(count):
        for d in LUCKY_DAY_OFFSETS:
            if d > 28:
                continue
            try:
                cand = date(year, month, d)
            except ValueError:
                continue
            if cand <= today:
                continue
            if d in avoid_days:
                # 冲日改用相邻吉数日
                alt = d - 1 if d - 1 in LUCKY_DAY_OFFSETS else d + 1
                try:
                    cand = date(year, month, alt)
                except ValueError:
                    pass
            result.append((cand.isoformat(), _format_date_desc(cand)))
            if len(result) >= count:
                return result
        # 下月
        month += 1
        if month > 12:
            month, year = 1, year + 1

    return result[:count]


def _format_date_desc(d: date) -> str:
    """日期说明：满月/吉日等（中文），locale=en 时由上层统一翻译。"""
    if d.day == 15:
        return "满月吉日，阴阳最和"
    if d.day in (1, 8, 18, 28):
        return "数理吉日，宜祭祀"
    return "五行相生之日，宜焚烧"


def build_explanation(
    death_date: date,
    pet_months: int,
    quantity: int,
    burning_dates: List[Tuple[str, str]],
) -> str:
    """生成玄学解释文案。"""
    parts = [
        f"自离世之日至今，已历{pet_months}个宠物月（合人年{pet_months}载）。",
        "通过焚烧，助宠物轮回，守护阴阳平衡。",
        f"本次建议焚烧数量为{quantity}，取吉数以利往生。",
    ]
    if burning_dates:
        parts.append("所选吉日避冲煞、应五行，可于所列日期行祭。")
    return "".join(parts)


def _auth_locale() -> str:
    data = (request.get_json(silent=True) or {}) if request else {}
    loc = (data.get("locale") or request.headers.get("Accept-Language", "") or "").strip().lower()
    if loc:
        loc = loc.split(",")[0].strip().split("-")[0].lower()
    return _normalize_locale(loc) if loc else DEFAULT_LOCALE


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "pet-eternal-flame"})


@app.route("/api/auth/register", methods=["POST"])
def register():
    """注册：body { username, password, locale? } -> { token, user }"""
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    locale = _auth_locale()

    if not username or not password:
        return jsonify({"error": _error_message("auth_username_password_required", locale)}), 400

    if len(username) < 2 or len(username) > 64:
        return jsonify({"error": _error_message("auth_username_password_required", locale)}), 400

    try:
        conn = get_connection()
    except Exception as e:
        if pymysql and isinstance(e, pymysql.err.OperationalError):
            return jsonify({"error": _error_message("auth_db_unavailable", locale)}), 503
        raise
    try:
        with cursor(conn) as cur:
            cur.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
                (username, hash_password(password)),
            )
            user_id = cur.lastrowid
        conn.commit()
    except Exception as e:
        if "Duplicate" in str(e) or "1062" in str(e) or "UNIQUE" in str(e):
            return jsonify({"error": _error_message("auth_username_taken", locale)}), 409
        if pymysql and isinstance(e, pymysql.err.OperationalError):
            return jsonify({"error": _error_message("auth_db_unavailable", locale)}), 503
        raise
    finally:
        conn.close()

    token = encode_token(user_id, username)
    return jsonify({"token": token, "user": {"id": str(user_id), "username": username}})


@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    """管理员专用登录接口，与 /api/auth/login 类似，但使用 admins 表并在 JWT 中标记 is_admin。"""
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    locale = _auth_locale()

    if not username or not password:
        return jsonify({"error": _error_message("auth_username_password_required", locale)}), 400

    try:
        conn = get_connection()
    except Exception as e:
        if pymysql and isinstance(e, pymysql.err.OperationalError):
            return jsonify({"error": _error_message("auth_db_unavailable", locale)}), 503
        raise
    try:
        with cursor(conn) as cur:
            cur.execute("SELECT id, password_hash FROM admins WHERE username = %s", (username,))
            row = cur.fetchone()
        if not row or not verify_password(password, row["password_hash"]):
            return jsonify({"error": _error_message("auth_invalid_credentials", locale)}), 401
        admin_id = row["id"]
    finally:
        conn.close()

    token = encode_token(admin_id, username, is_admin=True)
    return jsonify({"token": token, "user": {"id": str(admin_id), "username": username}})


@app.route("/api/auth/login", methods=["POST"])
def login():
    """登录：body { username, password, locale? } -> { token, user }"""
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    locale = _auth_locale()

    if not username or not password:
        return jsonify({"error": _error_message("auth_username_password_required", locale)}), 400

    try:
        conn = get_connection()
    except Exception as e:
        if pymysql and isinstance(e, pymysql.err.OperationalError):
            return jsonify({"error": _error_message("auth_db_unavailable", locale)}), 503
        raise
    try:
        with cursor(conn) as cur:
            cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (username,))
            row = cur.fetchone()
        if not row or not verify_password(password, row["password_hash"]):
            return jsonify({"error": _error_message("auth_invalid_credentials", locale)}), 401
        user_id = row["id"]
    finally:
        conn.close()

    token = encode_token(user_id, username)
    return jsonify({"token": token, "user": {"id": str(user_id), "username": username}})


def _current_user():
    """从 Authorization: Bearer <token> 解析当前用户，失败返回 None。"""
    auth = request.headers.get("Authorization") or ""
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:].strip()
    payload = decode_token(token)
    if not payload:
        return None
    return {"id": payload["sub"], "username": payload.get("username", ""), "is_admin": payload.get("is_admin", False)}


def _current_admin():
    """仅在当前令牌属于管理员时返回用户信息，否则返回 None。"""
    u = _current_user()
    if u and u.get("is_admin"):
        return u
    return None


# ===== 管理员 API 端点 =====

@app.route("/api/admin/language-strings", methods=["GET"])
def get_language_strings():
    """获取所有多语言字符串 (分页或全部)。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        with cursor(conn) as cur:
            # 支持分页参数
            page = request.args.get("page", 1, type=int)
            per_page = request.args.get("per_page", 100, type=int)
            offset = (page - 1) * per_page

            cur.execute(
                "SELECT id, `key`, zh, en, category, updated_at FROM language_strings ORDER BY id DESC LIMIT %s OFFSET %s",
                (per_page, offset),
            )
            rows = cur.fetchall()
        
        return jsonify([dict(row) if not isinstance(row, dict) else row for row in rows]), 200
    finally:
        conn.close()


@app.route("/api/language-strings", methods=["GET"])
def public_language_strings():
    """C 端：获取多语言字符串，结构与原来的 zh.json/en.json 类似。"""
    locale = _normalize_locale(request.args.get("locale", "zh"))
    field = "zh" if locale == "zh" else "en"
    try:
        conn = get_connection()
    except Exception:
        return jsonify({}), 200

    try:
        with cursor(conn) as cur:
            cur.execute("SELECT `key`, zh, en FROM language_strings")
            rows = cur.fetchall()
        data = _expand_language_rows(rows, field)
        return jsonify(data), 200
    finally:
        conn.close()


@app.route("/api/admin/language-strings", methods=["POST"])
def create_language_string():
    """创建新的多语言字符串。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    key = (data.get("key") or "").strip()
    zh = (data.get("zh") or "").strip()
    en = (data.get("en") or "").strip()
    category = (data.get("category") or "common").strip()

    if not key or not zh or not en:
        return jsonify({"error": "key, zh, en are required"}), 400

    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        with cursor(conn) as cur:
            cur.execute(
                "INSERT INTO language_strings (`key`, zh, en, category) VALUES (%s, %s, %s, %s)",
                (key, zh, en, category),
            )
        conn.commit()
        return jsonify({"message": "Created"}), 201
    except Exception as e:
        if "Duplicate" in str(e) or "1062" in str(e) or "UNIQUE" in str(e):
            return jsonify({"error": "key already exists"}), 409
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/admin/language-strings/<int:string_id>", methods=["PUT"])
def update_language_string(string_id: int):
    """更新多语言字符串。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    zh = data.get("zh")
    en = data.get("en")
    category = data.get("category")

    if not zh or not en:
        return jsonify({"error": "zh and en are required"}), 400

    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        with cursor(conn) as cur:
            if IS_PRODUCTION:
                cur.execute(
                    "UPDATE language_strings SET zh = %s, en = %s, category = %s, updated_at = NOW() WHERE id = %s",
                    (zh, en, category or "common", string_id),
                )
            else:
                cur.execute(
                    "UPDATE language_strings SET zh = %s, en = %s, category = %s, updated_at = datetime('now') WHERE id = %s",
                    (zh, en, category or "common", string_id),
                )
        conn.commit()
        return jsonify({"message": "Updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/admin/language-strings/<int:string_id>", methods=["DELETE"])
def delete_language_string(string_id: int):
    """删除多语言字符串。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        with cursor(conn) as cur:
            cur.execute("DELETE FROM language_strings WHERE id = %s", (string_id,))
        conn.commit()
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# ----- 用户管理 -----
@app.route("/api/admin/users", methods=["GET"])
def admin_list_users():
    """管理员：用户列表，分页与搜索。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    search = (request.args.get("search") or "").strip()
    offset = (page - 1) * per_page
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        with cursor(conn) as cur:
            if search:
                if IS_PRODUCTION:
                    cur.execute(
                        "SELECT id, username, created_at FROM users WHERE username LIKE %s ORDER BY id DESC LIMIT %s OFFSET %s",
                        ("%" + search + "%", per_page, offset),
                    )
                else:
                    cur.execute(
                        "SELECT id, username, created_at FROM users WHERE username LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?",
                        ("%" + search + "%", per_page, offset),
                    )
            else:
                cur.execute(
                    "SELECT id, username, created_at FROM users ORDER BY id DESC LIMIT %s OFFSET %s" if IS_PRODUCTION else
                    "SELECT id, username, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?",
                    (per_page, offset) if IS_PRODUCTION else (per_page, offset),
                )
            rows = cur.fetchall()
            if search:
                if IS_PRODUCTION:
                    cur.execute("SELECT COUNT(*) AS cnt FROM users WHERE username LIKE %s", ("%" + search + "%",))
                else:
                    cur.execute("SELECT COUNT(*) AS cnt FROM users WHERE username LIKE ?", ("%" + search + "%",))
            else:
                cur.execute("SELECT COUNT(*) AS cnt FROM users")
            total = cur.fetchone()["cnt"]
        items = [{"id": r["id"], "username": r["username"], "created_at": r["created_at"]} for r in rows]
        return jsonify({"items": items, "total": total}), 200
    finally:
        conn.close()


# ----- 统计 -----
@app.route("/api/admin/stats", methods=["GET"])
def admin_stats():
    """管理员：基础统计（用户总数、今日活跃、计算次数）。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        with cursor(conn) as cur:
            cur.execute("SELECT COUNT(*) AS cnt FROM users")
            total_users = cur.fetchone()["cnt"]
            if IS_PRODUCTION:
                cur.execute("SELECT COUNT(*) AS cnt FROM calculate_logs WHERE DATE(created_at) = CURDATE()")
            else:
                cur.execute("SELECT COUNT(*) AS cnt FROM calculate_logs WHERE date(created_at) = date('now')")
            today_calculates = cur.fetchone()["cnt"]
            cur.execute("SELECT COUNT(*) AS cnt FROM calculate_logs")
            total_calculates = cur.fetchone()["cnt"]
        return jsonify({
            "total_users": total_users,
            "today_calculates": today_calculates,
            "total_calculates": total_calculates,
        }), 200
    finally:
        conn.close()


# ----- 计算日志 -----
@app.route("/api/admin/calculate-logs", methods=["GET"])
def admin_calculate_logs():
    """管理员：计算请求日志，分页。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    offset = (page - 1) * per_page
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        with cursor(conn) as cur:
            cur.execute(
                "SELECT id, user_id, pet_name, death_date, locale, created_at FROM calculate_logs ORDER BY id DESC LIMIT %s OFFSET %s" if IS_PRODUCTION else
                "SELECT id, user_id, pet_name, death_date, locale, created_at FROM calculate_logs ORDER BY id DESC LIMIT ? OFFSET ?",
                (per_page, offset) if IS_PRODUCTION else (per_page, offset),
            )
            rows = cur.fetchall()
            cur.execute("SELECT COUNT(*) AS cnt FROM calculate_logs")
            total = cur.fetchone()["cnt"]
        items = [dict(r) for r in rows]
        return jsonify({"items": items, "total": total}), 200
    finally:
        conn.close()


# ----- 站点设置 -----
@app.route("/api/admin/settings", methods=["GET"])
def admin_get_settings():
    """管理员：获取全部站点设置。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        with cursor(conn) as cur:
            if IS_PRODUCTION:
                cur.execute("SELECT `key`, value, updated_at FROM site_settings")
            else:
                cur.execute('SELECT "key", value, updated_at FROM site_settings')
            rows = cur.fetchall()
        return jsonify({r["key"]: {"value": r["value"], "updated_at": r["updated_at"]} for r in rows}), 200
    finally:
        conn.close()


@app.route("/api/admin/settings", methods=["POST", "PUT"])
def admin_upsert_setting():
    """管理员：创建或更新单条设置。body: { key, value }"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json() or {}
    key = (data.get("key") or "").strip()
    value = data.get("value")
    if not key:
        return jsonify({"error": "key is required"}), 400
    if value is None:
        value = ""
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        with cursor(conn) as cur:
            if IS_PRODUCTION:
                cur.execute(
                    "INSERT INTO site_settings (`key`, value) VALUES (%s, %s) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()",
                    (key, str(value)),
                )
            else:
                cur.execute(
                    'INSERT INTO site_settings ("key", value) VALUES (?, ?) ON CONFLICT("key") DO UPDATE SET value = excluded.value, updated_at = datetime(\'now\')',
                    (key, str(value)),
                )
        conn.commit()
        return jsonify({"message": "OK"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# ----- 公告 -----
@app.route("/api/admin/announcements", methods=["GET"])
def admin_list_announcements():
    """管理员：公告列表。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        with cursor(conn) as cur:
            cur.execute("SELECT id, title, body, locale, active, start_at, end_at, created_at, updated_at FROM announcements ORDER BY id DESC")
            rows = cur.fetchall()
        return jsonify([dict(r) for r in rows]), 200
    finally:
        conn.close()


@app.route("/api/admin/announcements", methods=["POST"])
def admin_create_announcement():
    """管理员：创建公告。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()
    locale = (data.get("locale") or "zh").strip() or "zh"
    active = 1 if data.get("active", True) else 0
    start_at = data.get("start_at") or None
    end_at = data.get("end_at") or None
    if not title:
        return jsonify({"error": "title is required"}), 400
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        with cursor(conn) as cur:
            if IS_PRODUCTION:
                cur.execute(
                    "INSERT INTO announcements (title, body, locale, active, start_at, end_at) VALUES (%s, %s, %s, %s, %s, %s)",
                    (title, body, locale, active, start_at, end_at),
                )
            else:
                cur.execute(
                    "INSERT INTO announcements (title, body, locale, active, start_at, end_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (title, body, locale, active, start_at, end_at),
                )
            lid = cur.lastrowid
        conn.commit()
        return jsonify({"message": "Created", "id": lid}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/admin/announcements/<int:aid>", methods=["PUT"])
def admin_update_announcement(aid: int):
    """管理员：更新公告。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json() or {}
    title = data.get("title")
    body = data.get("body")
    locale = data.get("locale")
    active = data.get("active")
    start_at = data.get("start_at")
    end_at = data.get("end_at")
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        with cursor(conn) as cur:
            if IS_PRODUCTION:
                cur.execute(
                    "UPDATE announcements SET title = COALESCE(%s, title), body = COALESCE(%s, body), locale = COALESCE(%s, locale), active = COALESCE(%s, active), start_at = %s, end_at = %s, updated_at = NOW() WHERE id = %s",
                    (title, body, locale, active, start_at, end_at, aid),
                )
            else:
                cur.execute(
                    "UPDATE announcements SET title = COALESCE(?, title), body = COALESCE(?, body), locale = COALESCE(?, locale), active = COALESCE(?, active), start_at = ?, end_at = ?, updated_at = datetime('now') WHERE id = ?",
                    (title, body, locale, active, start_at, end_at, aid),
                )
        conn.commit()
        return jsonify({"message": "Updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/admin/announcements/<int:aid>", methods=["DELETE"])
def admin_delete_announcement(aid: int):
    """管理员：删除公告。"""
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    try:
        with cursor(conn) as cur:
            cur.execute("DELETE FROM announcements WHERE id = %s" if IS_PRODUCTION else "DELETE FROM announcements WHERE id = ?", (aid,))
        conn.commit()
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/announcements", methods=["GET"])
def public_announcements():
    """C 端：获取当前生效的公告列表，按 locale 过滤。"""
    locale = _normalize_locale(request.args.get("locale", "zh"))
    try:
        conn = get_connection()
    except Exception:
        return jsonify([]), 200
    try:
        with cursor(conn) as cur:
            if IS_PRODUCTION:
                cur.execute(
                    "SELECT id, title, body FROM announcements WHERE active = 1 AND locale = %s AND (start_at IS NULL OR start_at <= NOW()) AND (end_at IS NULL OR end_at >= NOW()) ORDER BY id DESC",
                    (locale,),
                )
            else:
                cur.execute(
                    "SELECT id, title, body FROM announcements WHERE active = 1 AND locale = ? AND (start_at IS NULL OR start_at <= datetime('now')) AND (end_at IS NULL OR end_at >= datetime('now')) ORDER BY id DESC",
                    (locale,),
                )
            rows = cur.fetchall()
        out = [{"id": r["id"], "title": r["title"], "body": r["body"]} for r in rows]
        return jsonify(out), 200
    finally:
        conn.close()


@app.route("/api/auth/me", methods=["GET"])
def me():
    """当前用户：Header Authorization: Bearer <token> -> { user }"""
    user = _current_user()
    if not user:
        locale = _normalize_locale(request.headers.get("Accept-Language", "") or "zh")
        return jsonify({"error": _error_message("auth_unauthorized", locale)}), 401
    return jsonify({"user": user})


@app.route("/api/calculate", methods=["POST"])
def calculate():
    """
    请求体: { "deathDate": "YYYY-MM-DD", "petName": "可选", "locale": "zh"|"en"|... }
    响应: petMonths, burningDates, suggestedQuantity, explanation（按 locale 返回或翻译）
    """
    data = request.get_json() or {}
    death_date_str = data.get("deathDate")
    pet_name = data.get("petName", "")
    locale = _get_locale(data)

    if not death_date_str:
        return jsonify({"error": _error_message("deathDate_required", locale)}), 400

    try:
        death_date = datetime.strptime(death_date_str.strip()[:10], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": _error_message("deathDate_invalid", locale)}), 400

    today = date.today()
    if death_date > today:
        return jsonify({"error": _error_message("deathDate_future", locale)}), 400

    pet_months = get_pet_months(death_date, today)
    raw_q = get_lucky_quantity_raw(
        death_date.day, death_date.month, pet_months
    )
    quantity = to_lucky_quantity(raw_q)
    burning_dates = get_burning_dates(death_date, today)
    explanation = build_explanation(death_date, pet_months, quantity, burning_dates)

    if locale in TRANSLATABLE_LOCALES:
        explanation = translate_zh_to_en(explanation)
        descs = translate_zh_to_en_batch([desc for _, desc in burning_dates])
        burning_dates = [(d, descs[i]) for i, (d, _) in enumerate(burning_dates)]

    result = {
        "petMonths": pet_months,
        "deathDate": death_date.isoformat(),
        "petName": pet_name,
        "suggestedQuantity": quantity,
        "burningDates": [{"date": d, "desc": desc} for d, desc in burning_dates],
        "explanation": explanation,
    }

    # 记录计算日志（用于运营统计）
    try:
        user = _current_user()
        user_id = None
        if user and not user.get("is_admin") and user.get("id"):
            try:
                user_id = int(user["id"])
            except (TypeError, ValueError):
                pass
        conn = get_connection()
        try:
            import json
            with cursor(conn) as cur:
                if IS_PRODUCTION:
                    cur.execute(
                        "INSERT INTO calculate_logs (user_id, pet_name, death_date, locale, result_json) VALUES (%s, %s, %s, %s, %s)",
                        (user_id, (pet_name or "")[:128], death_date.isoformat(), locale, json.dumps(result)),
                    )
                else:
                    cur.execute(
                        "INSERT INTO calculate_logs (user_id, pet_name, death_date, locale, result_json) VALUES (?, ?, ?, ?, ?)",
                        (user_id, (pet_name or "")[:128], death_date.isoformat(), locale, json.dumps(result)),
                    )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        pass

    return jsonify(result)


if __name__ == "__main__":
    try:
        init_db()
    except Exception as e:
        print(f"[WARN] 数据库初始化失败（登录/注册不可用）: {e}")
    app.run(host="0.0.0.0", port=5001, debug=True)
