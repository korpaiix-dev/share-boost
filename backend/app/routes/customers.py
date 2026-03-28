"""
/api/customers — Customer self-service routes
ลูกค้าดูข้อมูล+เพจของตัวเอง
"""
import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.auth import require_customer
from app.config import settings
from app.models import Customer, Page, Post, CommentLog, ChatLog, CreditLog
from app.schemas import (
    CustomerProfile, PageOut, PostOut, PostUpdateCaption,
    CommentOut, ChatOut, PageSettings, PageStats,
)

router = APIRouter(prefix="/api/customers", tags=["Customer"])


# === Helper: ตรวจว่าเพจเป็นของ customer คนนี้ ===
async def _get_owned_page(page_id: int, user: dict, db: AsyncSession) -> Page:
    result = await db.execute(
        select(Page).where(Page.id == page_id, Page.customer_id == user["user_id"])
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="ไม่พบเพจ หรือเพจนี้ไม่ใช่ของคุณ")
    return page


# ===================== Profile =====================

@router.get("/me", response_model=CustomerProfile)
async def get_my_profile(
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """ดูโปรไฟล์ของตัวเอง"""
    result = await db.execute(select(Customer).where(Customer.id == user["user_id"]))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="ไม่พบบัญชี")
    return c


@router.get("/me/pages", response_model=List[PageOut])
async def get_my_pages(
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """ดูเพจทั้งหมดของตัวเอง"""
    result = await db.execute(
        select(Page).where(Page.customer_id == user["user_id"]).order_by(Page.created_at.desc())
    )
    return result.scalars().all()


# ===================== Posts =====================

@router.get("/pages/{page_id}/posts", response_model=List[PostOut])
async def list_posts(
    page_id: int,
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """ดูโพสต์ทั้งหมดของเพจ"""
    await _get_owned_page(page_id, user, db)
    q = select(Post).where(Post.page_id == page_id)
    if status:
        q = q.where(Post.status == status)
    q = q.order_by(Post.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.put("/pages/{page_id}/posts/{post_id}", response_model=PostOut)
async def update_post_caption(
    page_id: int,
    post_id: int,
    body: PostUpdateCaption,
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """แก้ไขแคปชั่นก่อนโพสต์ (เฉพาะ status=queued)"""
    await _get_owned_page(page_id, user, db)
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.page_id == page_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="ไม่พบโพสต์")
    if post.status != "queued":
        raise HTTPException(status_code=400, detail="แก้ไขได้เฉพาะโพสต์ที่ยังไม่โพสต์")
    post.caption = body.caption
    await db.flush()
    await db.refresh(post)
    return post


# ===================== Media Upload =====================

@router.post("/pages/{page_id}/media")
async def upload_media(
    page_id: int,
    file: UploadFile = File(...),
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """อัพโหลดรูป/วิดีโอเข้าคลัง"""
    page = await _get_owned_page(page_id, user, db)

    # ตรวจ file type
    allowed = {".jpg", ".jpeg", ".png", ".mp4", ".mov", ".webp"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"ไฟล์ไม่รองรับ: {ext}")

    # ตรวจขนาด
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"ไฟล์ใหญ่เกิน {settings.MAX_UPLOAD_SIZE_MB}MB")

    # บันทึกไฟล์
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(page.id))
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    return {"filename": filename, "size": len(content), "media_type": "video" if ext in {".mp4", ".mov"} else "photo"}


@router.get("/pages/{page_id}/media")
async def list_media(
    page_id: int,
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """แสดงไฟล์มีเดียทั้งหมดในคลัง"""
    page = await _get_owned_page(page_id, user, db)
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(page.id))

    if not os.path.isdir(upload_dir):
        return []

    files = []
    valid_exts = {".jpg", ".jpeg", ".png", ".mp4", ".mov", ".webp"}
    for fname in sorted(os.listdir(upload_dir), reverse=True):
        ext = os.path.splitext(fname)[1].lower()
        if ext in valid_exts:
            fpath = os.path.join(upload_dir, fname)
            files.append({
                "filename": fname,
                "size": os.path.getsize(fpath),
                "media_type": "video" if ext in {".mp4", ".mov"} else "photo",
            })
    return files


# ===================== Comments =====================

@router.get("/pages/{page_id}/comments", response_model=List[CommentOut])
async def list_comments(
    page_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """ดูคอมเมนต์+คำตอบ AI ของเพจ"""
    await _get_owned_page(page_id, user, db)
    q = (
        select(CommentLog)
        .where(CommentLog.page_id == page_id)
        .order_by(CommentLog.created_at.desc())
        .offset(skip).limit(limit)
    )
    result = await db.execute(q)
    return result.scalars().all()


# ===================== Chat =====================

@router.get("/pages/{page_id}/chats", response_model=List[ChatOut])
async def list_chats(
    page_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """ดูแชท Messenger+คำตอบ AI"""
    await _get_owned_page(page_id, user, db)
    q = (
        select(ChatLog)
        .where(ChatLog.page_id == page_id)
        .order_by(ChatLog.created_at.desc())
        .offset(skip).limit(limit)
    )
    result = await db.execute(q)
    return result.scalars().all()


# ===================== Page Stats =====================

@router.get("/pages/{page_id}/stats", response_model=PageStats)
async def get_page_stats(
    page_id: int,
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """สถิติ engagement ของเพจ"""
    await _get_owned_page(page_id, user, db)

    from datetime import datetime, timezone
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total_posts = (await db.execute(
        select(func.count(Post.id)).where(Post.page_id == page_id)
    )).scalar() or 0

    posts_today = (await db.execute(
        select(func.count(Post.id)).where(Post.page_id == page_id, Post.posted_at >= today_start)
    )).scalar() or 0

    total_comments = (await db.execute(
        select(func.count(CommentLog.id)).where(CommentLog.page_id == page_id)
    )).scalar() or 0

    comments_today = (await db.execute(
        select(func.count(CommentLog.id)).where(
            CommentLog.page_id == page_id, CommentLog.created_at >= today_start
        )
    )).scalar() or 0

    total_chats = (await db.execute(
        select(func.count(ChatLog.id)).where(ChatLog.page_id == page_id)
    )).scalar() or 0

    ai_cost_total = (await db.execute(
        select(func.coalesce(func.sum(CreditLog.cost_usd), 0.0)).where(CreditLog.page_id == page_id)
    )).scalar() or 0.0

    ai_cost_today = (await db.execute(
        select(func.coalesce(func.sum(CreditLog.cost_usd), 0.0)).where(
            CreditLog.page_id == page_id, CreditLog.created_at >= today_start
        )
    )).scalar() or 0.0

    return PageStats(
        total_posts=total_posts,
        posts_today=posts_today,
        total_comments=total_comments,
        comments_today=comments_today,
        total_chats=total_chats,
        ai_cost_total=float(ai_cost_total),
        ai_cost_today=float(ai_cost_today),
    )


# ===================== Page Settings =====================

@router.get("/pages/{page_id}/settings", response_model=PageOut)
async def get_page_settings(
    page_id: int,
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """ดูการตั้งค่าเพจ"""
    page = await _get_owned_page(page_id, user, db)
    return page


@router.put("/pages/{page_id}/settings", response_model=PageOut)
async def update_page_settings(
    page_id: int,
    body: PageSettings,
    user: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    """ลูกค้าแก้ไขสไตล์คอนเทนต์ + keyword ของเพจตัวเอง"""
    page = await _get_owned_page(page_id, user, db)
    if body.caption_style is not None:
        page.caption_style = body.caption_style
    if body.keywords is not None:
        page.keywords = body.keywords
    await db.flush()
    await db.refresh(page)
    return page
