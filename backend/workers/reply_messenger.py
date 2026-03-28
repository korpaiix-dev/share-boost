#!/usr/bin/env python3
"""
ตอบแชท Messenger อัตโนมัติ (ใช้ Facebook Webhook)
อ่าน config จาก DB

ไฟล์นี้ออกแบบให้รับ webhook event จาก main.py
ไม่ได้รันเป็น standalone — เรียกจาก route /api/webhook/messenger
"""
import os
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Page, ChatLog, CreditLog
from app.services.ai import generate_chat_reply


FB_API = f"https://graph.facebook.com/{settings.FB_API_VERSION}"


def send_messenger_reply(recipient_id: str, message: str, access_token: str) -> bool:
    """ส่งข้อความกลับทาง Messenger"""
    url = f"{FB_API}/me/messages"
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message},
        "access_token": access_token,
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return "message_id" in result
    except urllib.error.HTTPError as e:
        print(f"Messenger Error ({e.code}): {e.read().decode()}")
        return False


async def handle_messenger_event(event: dict, db: AsyncSession):
    """
    จัดการ webhook event จาก Facebook Messenger
    event = messaging entry จาก webhook payload
    """
    sender_id = event.get("sender", {}).get("id", "")
    recipient_id = event.get("recipient", {}).get("id", "")  # คือ fb_page_id ของเรา
    message_data = event.get("message", {})
    message_text = message_data.get("text", "")

    if not sender_id or not message_text:
        return

    # หาเพจจาก DB ด้วย fb_page_id
    result = await db.execute(
        select(Page).where(Page.fb_page_id == recipient_id, Page.auto_chat == True)
    )
    page = result.scalar_one_or_none()
    if not page:
        return

    # ข้ามถ้า sender เป็นเพจเรา (ไม่ตอบตัวเอง)
    if sender_id == page.fb_page_id:
        return

    print(f"  💬 Messenger จาก {sender_id}: {message_text[:50]}...")

    # สร้างคำตอบด้วย AI
    reply_text, tokens_in, tokens_out, cost = generate_chat_reply(message_text, sender_id)
    print(f"  ↳ ตอบ: {reply_text[:50]}...")

    # บันทึก credit
    credit = CreditLog(
        page_id=page.id,
        agent_name="agent-chat",
        action=f"ตอบแชท: {sender_id}",
        model=settings.AI_MODEL,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=cost,
    )
    db.add(credit)

    # ส่งข้อความกลับ
    success = send_messenger_reply(sender_id, reply_text, page.access_token)

    # บันทึกลง DB
    log = ChatLog(
        page_id=page.id,
        sender_id=sender_id,
        sender_name=None,  # ดึงชื่อแยกได้ทีหลัง
        message_text=message_text,
        reply_text=reply_text if success else None,
        replied_at=datetime.now(timezone.utc) if success else None,
    )
    db.add(log)
    await db.flush()

    if success:
        print(f"  ✅ ตอบแชทสำเร็จ")
    else:
        print(f"  ❌ ตอบแชทไม่สำเร็จ")
