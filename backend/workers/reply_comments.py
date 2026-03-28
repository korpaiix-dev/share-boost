#!/usr/bin/env python3
"""
น้องพิ้งค์ 🐰 — ตอบคอมเมนต์ Facebook อัตโนมัติ
อ่าน config จาก DB, ดึงคอมเมนต์ใหม่, ตอบด้วย AI

รันผ่าน: python -m workers.reply_comments
หรือ cron ทุก 30 นาที
"""
import os
import sys
import asyncio
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session, init_db
from app.models import Page, CommentLog, CreditLog, PageStatus
from app.services.facebook import fetch_page_posts, fetch_comments, reply_comment
from app.services.ai import generate_comment_reply

MAX_REPLIES_PER_PAGE = 5
MAX_COMMENT_AGE_HOURS = 24


def is_recent(created_time_str: str) -> bool:
    """ตรวจว่าคอมเมนต์อยู่ใน 24 ชม. ล่าสุด"""
    try:
        ct = datetime.fromisoformat(created_time_str.replace("+0000", "+00:00"))
        return (datetime.now(timezone.utc) - ct) < timedelta(hours=MAX_COMMENT_AGE_HOURS)
    except Exception:
        return False


async def get_replied_comment_ids(page_id: int, db: AsyncSession) -> set:
    """ดึง fb_comment_id ที่ตอบไปแล้วจาก DB"""
    result = await db.execute(
        select(CommentLog.fb_comment_id).where(CommentLog.page_id == page_id)
    )
    return {row[0] for row in result.all()}


async def process_page(page: Page, db: AsyncSession) -> int:
    """ตอบคอมเมนต์เพจเดียว — return จำนวนที่ตอบ"""
    print(f"\n  🐰 กำลังตรวจคอมเมนต์เพจ: {page.page_name}")

    replied_ids = await get_replied_comment_ids(page.id, db)
    posts = fetch_page_posts(page.fb_page_id, page.access_token, limit=20)
    print(f"    พบ {len(posts)} โพสต์")

    reply_count = 0
    for post_data in posts:
        if reply_count >= MAX_REPLIES_PER_PAGE:
            break

        post_id = post_data.get("id")
        comments = fetch_comments(post_id, page.access_token)

        for comment in comments:
            if reply_count >= MAX_REPLIES_PER_PAGE:
                break

            comment_id = comment.get("id", "")
            comment_text = comment.get("message", "").strip()
            commenter_name = comment.get("from", {}).get("name", "ลูกเพจ")
            commenter_id = comment.get("from", {}).get("id", "")
            created_time = comment.get("created_time", "")

            # ข้าม: ตอบแล้ว, เก่าเกิน, ว่างเปล่า, เป็นเพจเรา
            if comment_id in replied_ids:
                continue
            if not is_recent(created_time):
                continue
            if not comment_text:
                continue
            if commenter_id == page.fb_page_id:
                continue

            print(f"    💬 {commenter_name}: {comment_text[:50]}...")

            # สร้างคำตอบด้วย AI
            reply_text, tokens_in, tokens_out, cost = generate_comment_reply(comment_text, commenter_name)
            print(f"    ↳ 🐰 ตอบ: {reply_text[:50]}...")

            # บันทึก credit
            credit = CreditLog(
                page_id=page.id,
                agent_name="agent-pink",
                action=f"ตอบคอมเมนต์: {commenter_name}",
                model=settings.AI_MODEL,
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                cost_usd=cost,
            )
            db.add(credit)

            # ตอบบน Facebook
            success = reply_comment(comment_id, reply_text, page.access_token)

            # บันทึกลง DB
            log = CommentLog(
                page_id=page.id,
                fb_comment_id=comment_id,
                commenter_name=commenter_name,
                comment_text=comment_text,
                reply_text=reply_text if success else None,
                replied_at=datetime.now(timezone.utc) if success else None,
            )
            db.add(log)

            if success:
                reply_count += 1
                print(f"    ✅ ตอบสำเร็จ! ({reply_count}/{MAX_REPLIES_PER_PAGE})")
            else:
                print(f"    ❌ ตอบไม่สำเร็จ")

    return reply_count


async def main():
    print(f"=== 🐰 น้องพิ้งค์ เริ่มทำงาน ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ===")
    await init_db()

    async with async_session() as db:
        result = await db.execute(
            select(Page).where(Page.auto_comment == True, Page.status == PageStatus.active)
        )
        pages = result.scalars().all()

        if not pages:
            print("ไม่พบเพจที่เปิด auto_comment")
            return

        print(f"พบ {len(pages)} เพจที่ต้องดูแล")
        total_replies = 0

        for page in pages:
            try:
                count = await process_page(page, db)
                total_replies += count
            except Exception as e:
                print(f"  ❌ Error เพจ {page.page_name}: {e}")

        await db.commit()

    print(f"\n=== 🐰 น้องพิ้งค์ เสร็จสิ้น (ตอบ {total_replies} คอมเมนต์ จาก {len(pages)} เพจ) ===")


if __name__ == "__main__":
    asyncio.run(main())
