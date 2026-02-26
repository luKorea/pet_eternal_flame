"""
中文 → 英文翻译封装，基于 deep-translator（Google Translate）。
请求 locale=en 时用于将后端生成的中文文案译为英文；失败时回退为原文。
"""
from typing import List

try:
    from deep_translator import GoogleTranslator
except ImportError:
    GoogleTranslator = None


def translate_zh_to_en(text: str) -> str:
    """将中文文案译为英文，失败或未安装依赖时返回原文。"""
    if not text or not text.strip():
        return text
    if GoogleTranslator is None:
        return text
    try:
        return GoogleTranslator(source="zh-CN", target="en").translate(text=text) or text
    except Exception:
        return text


def translate_zh_to_en_batch(texts: List[str]) -> List[str]:
    """批量将中文译为英文，单条失败则该条返回原文。"""
    if not texts:
        return []
    if GoogleTranslator is None:
        return list(texts)
    try:
        translator = GoogleTranslator(source="zh-CN", target="en")
        return translator.translate_batch(texts) or list(texts)
    except Exception:
        return list(texts)
