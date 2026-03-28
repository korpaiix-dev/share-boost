#!/usr/bin/env python3
"""
น้องฟ้า 🦊 — วิเคราะห์สถิติเพจ Facebook
อ่าน config จาก DB, ดึง insights, สรุปรายงาน AI

รันผ่าน: python -m workers.analyze_page
หรือ cron วันละ 1 ครั้ง (08:00)
"""
import os
import sys
import asyncio
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session, init_db
from app.models import Page, Post, CommentLog, CreditLog, PageStatus
from app.services.facebook import fetch_page_info, fetch_page_posts
from app.services.ai import generate_page_report


async def analyze_single_page(page: Page, db: AsyncSession) -> dict:
    """วิเคราะห์เพจเดียว — return report dict"""
    print(f"\n  📊 กำลังวิเคราะห์เพจ: {page.page_name}")

    # ดึงข้อมูลจาก Facebook
    page_info = fetch_page_info(page.fb_page_id, page.access_token)
    fb_posts = fetch_page_posts(page.fb_page_id, page.access_token, limit=10)

    # สรุป engagement จากโพสต์ล่าสุด
    total_likes = 0
    total_comments = 0
    total_shares = 0
    top_post = None
    top_likes = 0

    for p in fb_posts:
        likes = p.get("likes", {}).get("summary", {}).get("total_count", 0)
        comments = p.get("comments", {}).get("summary", {}).get("total_count", 0)
        shares = p.get("shares", {}).get("count", 0)
        total_likes += likes
        total_comments += comments
        total_shares += shares
        if likes > top_likes:
            top_likes = likes
            top_post = {
                "id": p.get("id"),
                "message": (p.get("message") or "")[:100],
                "likes": likes,
                "comments": comments,
                "shares": shares,
            }

    insights = {
        "page_name": page_info.get("name", page.page_name),
        "followers": page_info.get("followers_count", 0),
        "fans": page_info.get("fan_count", 0),
        "recent_posts_count": len(fb_posts),
        "total_likes": total_likes,
        "total_comments": total_comments,
        "total_shares": total_shares,
        "top_post": top_post,
    }

    # ดึงสถิติจาก DB ของเรา
    posts_in_db = (await db.execute(
        select(func.count(Post.id)).where(Post.page_id == page.id)
    )).scalar() or 0

    comments_in_db = (await db.execute(
        select(func.count(CommentLog.id)).where(CommentLog.page_id == page.id)
    )).scalar() or 0

    ai_cost = (await db.execute(
        select(func.coalesce(func.sum(CreditLog.cost_usd), 0.0)).where(CreditLog.page_id == page.id)
    )).scalar() or 0.0

    insights["posts_by_system"] = posts_in_db
    insights["comments_replied"] = comments_in_db
    insights["total_ai_cost_usd"] = float(ai_cost)

    print(f"  ข้อมูล: Followers={insights['followers']}, Likes={total_likes}, Cost=${ai_cost:.4f}")

    # ให้ AI สรุปรายงาน
    summary, tokens_in, tokens_out, cost = generate_page_report(insights, page.page_name)
    print(f"  ✅ สรุปเสร็จ: {summary[:80]}...")

    # บันทึก credit
    credit = CreditLog(
        page_id=page.id,
        agent_name="agent-fah",
        action=f"รายงานสถิติประจำวัน",
        model=settings.AI_MODEL,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=cost,
    )
    db.add(credit)

    return {
        "page_id": page.id,
        "page_name": page.page_name,
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "insights": insights,
        "summary": summary,
    }


async def main():
    print(f"=== 🦊 น้องฟ้า เริ่มวิเคราะห์ ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ===")
    await init_db()

    async with async_session() as db:
        result = await db.execute(
            select(Page).where(Page.status == PageStatus.active)
        )
        pages = result.scalars().all()

        if not pages:
            print("ไม่พบเพจที่ active")
            return

        print(f"พบ {len(pages)} เพจที่ต้องวิเคราะห์")
        reports = []

        for page in pages:
            try:
                report = await analyze_single_page(page, db)
                reports.append(report)
            except Exception as e:
                print(f"  ❌ Error วิเคราะห์เพจ {page.page_name}: {e}")

        await db.commit()

    print(f"\n=== 🦊 น้องฟ้า เสร็จสิ้น (วิเคราะห์ {len(reports)} เพจ) ===")


if __name__ == "__main__":
    asyncio.run(main())
