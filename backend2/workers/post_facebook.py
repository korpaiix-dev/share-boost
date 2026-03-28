#!/usr/bin/env python3
"""
น้องมิ้นท์ 🐱 + น้องท็อป 🐶 — โพสต์ Facebook อัตโนมัติ
อ่าน config จาก DB, เลือกมีเดียจากคลัง, สร้างแคปชั่น AI, โพสต์

รันผ่าน: python -m workers.post_facebook
หรือ cron ตามเวลาที่กำหนดใน post_times ของแต่ละเพจ
"""
import os
import sys
import asyncio
import random
from datetime import datetime, timezone
from pathlib import Path

# เพิ่ม path ให้ import app ได้
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session, init_db
from app.models import Page, Post, CreditLog, PostStatus, PageStatus
from app.services.ai import generate_caption
from app.services.facebook import post_photo, post_video, post_text


VALID_EXTS = {".jpg", ".jpeg", ".png", ".mp4", ".mov", ".webp"}


def get_unposted_media(page_id: int, posted_filenames: set) -> list:
    """หาไฟล์มีเดียที่ยังไม่เคยโพสต์"""
    upload_dir = Path(settings.UPLOAD_DIR) / str(page_id)
    if not upload_dir.is_dir():
        return []

    media_files = []
    for f in upload_dir.iterdir():
        if f.is_file() and f.suffix.lower() in VALID_EXTS and f.name not in posted_filenames:
            media_files.append(f)
    return media_files


async def process_page(page: Page, db: AsyncSession):
    """ประมวลผลเพจเดียว — สร้างแคปชั่น + โพสต์"""
    print(f"\n🐱 น้องมิ้นท์กำลังดูแลเพจ: {page.page_name}")

    # ดึงรายชื่อไฟล์ที่เคยโพสต์แล้ว
    result = await db.execute(
        select(Post.media_filename).where(Post.page_id == page.id, Post.status == PostStatus.posted)
    )
    posted_filenames = {row[0] for row in result.all() if row[0]}

    # หาไฟล์ที่ยังไม่โพสต์
    unposted = get_unposted_media(page.id, posted_filenames)
    if not unposted:
        print(f"  ⚠️ ไม่มีมีเดียใหม่สำหรับเพจ {page.page_name}")
        return

    # สุ่มเลือกไฟล์
    media_file = random.choice(unposted)
    is_video = media_file.suffix.lower() in {".mp4", ".mov"}
    media_type = "วิดีโอ" if is_video else "รูปภาพ"
    print(f"  📸 เลือกไฟล์: {media_file.name} ({media_type})")

    # อ่านรูปเพื่อส่งให้ AI วิเคราะห์
    with open(media_file, "rb") as f:
        file_bytes = f.read()

    image_bytes = file_bytes if not is_video else None

    # สร้างแคปชั่นด้วย AI
    caption, tokens_in, tokens_out, cost = generate_caption(
        style_id=page.caption_style.value if hasattr(page.caption_style, "value") else page.caption_style,
        keywords=page.keywords or "",
        image_bytes=image_bytes,
        media_type=media_type,
    )
    print(f"  ✍️ แคปชั่น: {caption[:80]}...")

    # บันทึก credit log
    credit = CreditLog(
        page_id=page.id,
        agent_name="agent-mint",
        action=f"แต่งแคปชั่น: {media_file.name}",
        model=settings.AI_MODEL,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=cost,
    )
    db.add(credit)

    # โพสต์ลง Facebook
    fb_post_id = None
    if is_video:
        fb_post_id = post_video(page.fb_page_id, page.access_token, caption, file_bytes, media_file.name)
    else:
        fb_post_id = post_photo(page.fb_page_id, page.access_token, caption, file_bytes, media_file.name)

    # บันทึกลง DB
    post = Post(
        page_id=page.id,
        fb_post_id=fb_post_id,
        caption=caption,
        media_type="video" if is_video else "photo",
        media_filename=media_file.name,
        status=PostStatus.posted if fb_post_id else PostStatus.failed,
        posted_at=datetime.now(timezone.utc) if fb_post_id else None,
    )
    db.add(post)
    await db.flush()

    if fb_post_id:
        print(f"  ✅ โพสต์สำเร็จ! FB Post ID: {fb_post_id}")
    else:
        print(f"  ❌ โพสต์ไม่สำเร็จ")


async def main():
    print(f"=== 🐱 น้องมิ้นท์ + 🐶 น้องท็อป เริ่มทำงาน ({datetime.now().strftime('%Y-%m-%d %H:%M')}) ===")
    await init_db()

    async with async_session() as db:
        # ดึงเพจที่เปิด auto_post และ active
        result = await db.execute(
            select(Page).where(Page.auto_post == True, Page.status == PageStatus.active)
        )
        pages = result.scalars().all()

        if not pages:
            print("ไม่พบเพจที่เปิด auto_post")
            return

        print(f"พบ {len(pages)} เพจที่ต้องดูแล")

        for page in pages:
            try:
                await process_page(page, db)
            except Exception as e:
                print(f"  ❌ Error เพจ {page.page_name}: {e}")

        await db.commit()

    print(f"\n=== 🐱 น้องมิ้นท์ เสร็จสิ้น ===")


if __name__ == "__main__":
    asyncio.run(main())
