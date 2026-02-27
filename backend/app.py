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

try:
    import pymysql
except ImportError:
    pymysql = None

app = Flask(__name__)
CORS(
    app,
    origins=["*"],
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"],
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
    return {"id": payload["sub"], "username": payload.get("username", "")}


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

    return jsonify({
        "petMonths": pet_months,
        "deathDate": death_date.isoformat(),
        "petName": pet_name,
        "suggestedQuantity": quantity,
        "burningDates": [{"date": d, "desc": desc} for d, desc in burning_dates],
        "explanation": explanation,
    })


if __name__ == "__main__":
    try:
        init_db()
    except Exception as e:
        print(f"[WARN] 数据库初始化失败（登录/注册不可用）: {e}")
    app.run(host="0.0.0.0", port=5001, debug=True)
