"""
AI Service — เรียก OpenRouter API (Gemini 2.5 Flash)
ใช้ร่วมกันทุก worker
"""
import json
import base64
import urllib.request
import urllib.error
from typing import Optional, Tuple

from app.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ราคา Gemini 2.5 Flash (ต่อ 1M tokens)
PRICE_INPUT = 0.15 / 1_000_000
PRICE_OUTPUT = 0.60 / 1_000_000

# สไตล์แคปชั่นที่รองรับ
CAPTION_STYLES = {
    "sexy": "เซ็กซี่ น่าดึงดูด ขี้เล่น เชิญชวน",
    "cute": "น่ารัก สดใส อ่อนหวาน ใสๆ",
    "funny": "ขำขัน มุกตลก เรียกเสียงหัวเราะ",
    "sell": "กระตุ้นยอดขาย CTA แรง ใช้คำโน้มน้าว",
    "classy": "หรูหรา ดูแพง พรีเมียม สวยสง่า",
}


def _call_openrouter(messages: list, model: Optional[str] = None) -> Tuple[Optional[str], int, int, float]:
    """
    เรียก OpenRouter API
    return: (text, tokens_in, tokens_out, cost_usd)
    """
    if not settings.OPENROUTER_API_KEY:
        return None, 0, 0, 0.0

    payload = {
        "model": model or settings.AI_MODEL,
        "messages": messages,
    }
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    req = urllib.request.Request(
        OPENROUTER_URL, data=json.dumps(payload).encode(), headers=headers
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode())

        usage = result.get("usage", {})
        tokens_in = usage.get("prompt_tokens", 0)
        tokens_out = usage.get("completion_tokens", 0)
        cost = tokens_in * PRICE_INPUT + tokens_out * PRICE_OUTPUT

        text = None
        if "choices" in result and result["choices"]:
            text = result["choices"][0]["message"]["content"].strip()

        return text, tokens_in, tokens_out, cost
    except Exception as e:
        print(f"OpenRouter Error: {e}")
        return None, 0, 0, 0.0


def generate_caption(
    style_id: str,
    keywords: str = "",
    image_bytes: Optional[bytes] = None,
    media_type: str = "รูปภาพ",
) -> Tuple[str, int, int, float]:
    """
    น้องมิ้นท์ — สร้างแคปชั่น Facebook
    return: (caption, tokens_in, tokens_out, cost_usd)
    """
    style = CAPTION_STYLES.get(style_id, CAPTION_STYLES["classy"])

    prompt = (
        f"สร้างแคปชั่นเฟสบุ๊ค 1 โพสต์ สำหรับ{media_type} ความยาว 2-4 บรรทัด โทน: {style}\n"
        f"ข้อกำหนด:\n"
        f"1. วิเคราะห์และเขียนให้สอดคล้องกับภาพที่แนบมา\n"
        f"2. ให้มีแฮชแท็ก 3-4 ตัว\n"
        f"3. ห้ามมีคำอธิบายหรือคำตอบรับใดๆ เด็ดขาด เอาเฉพาะสเตตัสที่จะโพสต์เพียวๆ\n"
        f"4. ห้ามเอาชื่อไฟล์หรือตัวเลขมามั่วเป็นชื่อคน"
    )
    if keywords:
        prompt += f"\n5. **สำคัญมาก: ต้องแต่งประโยคเชิญชวนเกี่ยวกับ '{keywords}' วางไว้บรรทัดสุดท้าย**"

    # สร้าง user content (รองรับ vision)
    user_content: list | str
    if image_bytes:
        b64 = base64.b64encode(image_bytes).decode()
        user_content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
        ]
    else:
        user_content = prompt

    messages = [
        {"role": "system", "content": f"คุณคือแอดมินเพจมืออาชีพ โทนการเขียน: {style}"},
        {"role": "user", "content": user_content},
    ]

    text, t_in, t_out, cost = _call_openrouter(messages)
    if not text:
        text = "ทักทายจ้า วันนี้มีอะไรดีๆ มาฝาก 💕 #ของดี #แนะนำ #วันนี้"
    return text, t_in, t_out, cost


def generate_comment_reply(
    comment_text: str,
    commenter_name: str,
) -> Tuple[str, int, int, float]:
    """
    น้องพิ้งค์ — สร้างคำตอบคอมเมนต์
    return: (reply, tokens_in, tokens_out, cost_usd)
    """
    messages = [
        {
            "role": "system",
            "content": (
                "คุณคือแอดมินเพจ คอยตอบคอมเมนต์ลูกเพจแบบน่ารัก สุภาพ ขี้เล่นนิดๆ\n"
                "กฎ:\n"
                "1. ตอบสั้นๆ 1-2 ประโยค ไม่เกิน 50 คำ\n"
                "2. ถ้าเขาชม ก็ขอบคุณน่ารักๆ\n"
                "3. ถ้าเขาพูดหยาบคายให้ตอบสุภาพแต่ไม่สนใจเนื้อหา\n"
                "4. ส่งคำตอบเพียวๆ ไม่ต้องมีคำอธิบาย"
            ),
        },
        {
            "role": "user",
            "content": f'คอมเมนต์จาก {commenter_name}: "{comment_text}"\n\nตอบกลับ:',
        },
    ]

    text, t_in, t_out, cost = _call_openrouter(messages)
    if not text:
        text = "ขอบคุณที่แวะมาทักค่ะ 💕"
    return text, t_in, t_out, cost


def generate_chat_reply(
    message_text: str,
    sender_name: str,
) -> Tuple[str, int, int, float]:
    """
    ตอบแชท Messenger
    return: (reply, tokens_in, tokens_out, cost_usd)
    """
    messages = [
        {
            "role": "system",
            "content": (
                "คุณคือแอดมินเพจ คอยตอบแชท Messenger\n"
                "กฎ:\n"
                "1. ตอบสุภาพ เป็นมิตร สั้นกระชับ\n"
                "2. ถ้าถามราคาหรือสินค้า ให้แนะนำอย่างดี\n"
                "3. ส่งคำตอบเพียวๆ ไม่ต้องมีคำอธิบาย"
            ),
        },
        {
            "role": "user",
            "content": f'แชทจาก {sender_name}: "{message_text}"\n\nตอบกลับ:',
        },
    ]

    text, t_in, t_out, cost = _call_openrouter(messages)
    if not text:
        text = "สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ? 😊"
    return text, t_in, t_out, cost


def generate_page_report(insights: dict, page_name: str) -> Tuple[str, int, int, float]:
    """
    น้องฟ้า — สรุปรายงานสถิติเพจ
    return: (summary, tokens_in, tokens_out, cost_usd)
    """
    insights_text = json.dumps(insights, ensure_ascii=False, indent=2)
    messages = [
        {
            "role": "system",
            "content": "คุณคือนักวิเคราะห์สถิติเพจ Facebook ชื่อ 'น้องฟ้า' สรุปรายงานให้เจ้าของเพจ",
        },
        {
            "role": "user",
            "content": (
                f'สรุปรายงานสถิติเพจ "{page_name}" วันนี้ (ภาษาไทย) จากข้อมูล:\n{insights_text}\n\n'
                "สรุป 2 ส่วน:\n"
                "1. สรุปสถิติ (4-6 บรรทัด)\n"
                "2. แนะนำเวลาโพสต์ที่เหมาะสม"
            ),
        },
    ]

    text, t_in, t_out, cost = _call_openrouter(messages)
    if not text:
        text = "ไม่สามารถสร้างรายงานได้ กรุณาตรวจสอบ API"
    return text, t_in, t_out, cost
