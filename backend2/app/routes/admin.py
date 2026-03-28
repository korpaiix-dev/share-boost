"""
/api/admin — CRUD ลูกค้า, จัดการเพจ, dashboard stats
เฉพาะ admin เท่านั้น
"""
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.auth import require_admin, hash_password
from app.models import (
    Customer, Page, Post, CommentLog, ChatLog, CreditLog, Payment,
    CustomerStatus, PackageType, PostStatus, PaymentStatus,
)
from app.schemas import (
    CustomerCreate, CustomerUpdate, CustomerOut,
    PageCreate, PageUpdate, PageOut,
    PaymentCreate, PaymentOut,
    CreditLogOut, DashboardStats,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


# ===================== Dashboard =====================

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """สถิติรวมสำหรับ Admin Dashboard"""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total_customers = (await db.execute(select(func.count(Customer.id)))).scalar() or 0
    active_customers = (await db.execute(
        select(func.count(Customer.id)).where(Customer.status == CustomerStatus.active)
    )).scalar() or 0
    total_pages = (await db.execute(select(func.count(Page.id)))).scalar() or 0
    active_pages = (await db.execute(
        select(func.count(Page.id)).where(Page.status == "active")
    )).scalar() or 0

    # โพสต์วันนี้
    posts_today = (await db.execute(
        select(func.count(Post.id)).where(Post.posted_at >= today_start)
    )).scalar() or 0

    # คอมเมนต์วันนี้
    comments_today = (await db.execute(
        select(func.count(CommentLog.id)).where(CommentLog.created_at >= today_start)
    )).scalar() or 0

    # รายได้รวม (เฉพาะที่ paid)
    total_revenue = (await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0.0)).where(Payment.status == PaymentStatus.paid)
    )).scalar() or 0.0

    # ค่า AI รวม
    total_ai_cost = (await db.execute(
        select(func.coalesce(func.sum(CreditLog.cost_usd), 0.0))
    )).scalar() or 0.0

    return DashboardStats(
        total_customers=total_customers,
        active_customers=active_customers,
        total_pages=total_pages,
        active_pages=active_pages,
        total_posts_today=posts_today,
        total_comments_today=comments_today,
        total_revenue=float(total_revenue),
        total_ai_cost=float(total_ai_cost),
    )


# ===================== Customers CRUD =====================

@router.get("/customers", response_model=List[CustomerOut])
async def list_customers(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """รายการลูกค้าทั้งหมด"""
    q = select(Customer).options(selectinload(Customer.pages))
    if status:
        q = q.where(Customer.status == status)
    q = q.order_by(Customer.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    customers = result.scalars().all()
    return [
        CustomerOut(
            id=c.id, name=c.name, email=c.email, phone=c.phone,
            package=c.package.value if hasattr(c.package, 'value') else c.package,
            status=c.status.value if hasattr(c.status, 'value') else c.status,
            created_at=c.created_at, expires_at=c.expires_at,
            pages_count=len(c.pages),
        )
        for c in customers
    ]


@router.get("/customers/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """ดูข้อมูลลูกค้ารายคน"""
    result = await db.execute(
        select(Customer).options(selectinload(Customer.pages)).where(Customer.id == customer_id)
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="ไม่พบลูกค้า")
    return CustomerOut(
        id=c.id, name=c.name, email=c.email, phone=c.phone,
        package=c.package.value if hasattr(c.package, 'value') else c.package,
        status=c.status.value if hasattr(c.status, 'value') else c.status,
        created_at=c.created_at, expires_at=c.expires_at,
        pages_count=len(c.pages),
    )


@router.post("/customers", response_model=CustomerOut, status_code=201)
async def create_customer(body: CustomerCreate, db: AsyncSession = Depends(get_db)):
    """สร้างลูกค้าใหม่"""
    exists = await db.execute(select(Customer).where(Customer.email == body.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="อีเมลนี้มีอยู่แล้ว")

    customer = Customer(
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        package=PackageType(body.package),
        status=CustomerStatus.active,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(customer)
    await db.flush()
    await db.refresh(customer)

    return CustomerOut(
        id=customer.id, name=customer.name, email=customer.email,
        phone=customer.phone,
        package=customer.package.value,
        status=customer.status.value,
        created_at=customer.created_at, expires_at=customer.expires_at,
        pages_count=0,
    )


@router.put("/customers/{customer_id}", response_model=CustomerOut)
async def update_customer(customer_id: int, body: CustomerUpdate, db: AsyncSession = Depends(get_db)):
    """แก้ไขข้อมูลลูกค้า"""
    result = await db.execute(
        select(Customer).options(selectinload(Customer.pages)).where(Customer.id == customer_id)
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="ไม่พบลูกค้า")

    if body.name is not None:
        c.name = body.name
    if body.email is not None:
        c.email = body.email
    if body.phone is not None:
        c.phone = body.phone
    if body.password is not None:
        c.password_hash = hash_password(body.password)
    if body.package is not None:
        c.package = PackageType(body.package)
    if body.status is not None:
        c.status = CustomerStatus(body.status)
    if body.expires_at is not None:
        c.expires_at = body.expires_at

    await db.flush()
    await db.refresh(c)

    return CustomerOut(
        id=c.id, name=c.name, email=c.email, phone=c.phone,
        package=c.package.value, status=c.status.value,
        created_at=c.created_at, expires_at=c.expires_at,
        pages_count=len(c.pages),
    )


@router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """ลบลูกค้า (cascade ลบเพจ+ข้อมูลทั้งหมด)"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="ไม่พบลูกค้า")
    await db.delete(c)
    return {"detail": "ลบลูกค้าเรียบร้อย"}


# ===================== Pages CRUD =====================

@router.get("/pages", response_model=List[PageOut])
async def list_pages(
    customer_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """รายการเพจทั้งหมด (filter ตาม customer ได้)"""
    q = select(Page)
    if customer_id:
        q = q.where(Page.customer_id == customer_id)
    q = q.order_by(Page.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/pages", response_model=PageOut, status_code=201)
async def create_page(body: PageCreate, db: AsyncSession = Depends(get_db)):
    """เพิ่มเพจ Facebook ให้ลูกค้า"""
    cust = await db.execute(select(Customer).where(Customer.id == body.customer_id))
    if not cust.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="ไม่พบลูกค้า")

    page = Page(
        customer_id=body.customer_id,
        fb_page_id=body.fb_page_id,
        page_name=body.page_name,
        access_token=body.access_token,
        caption_style=body.caption_style,
        keywords=body.keywords,
        auto_post=body.auto_post,
        auto_comment=body.auto_comment,
        auto_chat=body.auto_chat,
        post_times=body.post_times or ["12:00", "19:00"],
    )
    db.add(page)
    await db.flush()
    await db.refresh(page)
    return page


@router.put("/pages/{page_id}", response_model=PageOut)
async def update_page(page_id: int, body: PageUpdate, db: AsyncSession = Depends(get_db)):
    """แก้ไขการตั้งค่าเพจ"""
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="ไม่พบเพจ")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(page, field, value)

    await db.flush()
    await db.refresh(page)
    return page


@router.delete("/pages/{page_id}")
async def delete_page(page_id: int, db: AsyncSession = Depends(get_db)):
    """ลบเพจ"""
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="ไม่พบเพจ")
    await db.delete(page)
    return {"detail": "ลบเพจเรียบร้อย"}


# ===================== Payments =====================

@router.get("/payments", response_model=List[PaymentOut])
async def list_payments(
    customer_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """ดูประวัติการชำระเงินทั้งหมด"""
    q = select(Payment)
    if customer_id:
        q = q.where(Payment.customer_id == customer_id)
    q = q.order_by(Payment.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/payments", response_model=PaymentOut, status_code=201)
async def create_payment(body: PaymentCreate, db: AsyncSession = Depends(get_db)):
    """บันทึกการชำระเงิน"""
    payment = Payment(
        customer_id=body.customer_id,
        amount=body.amount,
        method=body.method,
        status=PaymentStatus.paid,
        paid_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)
    return payment


# ===================== Credit Log =====================

@router.get("/credits", response_model=List[CreditLogOut])
async def list_credits(
    page_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """ดูค่าใช้จ่าย AI ทั้งหมด"""
    q = select(CreditLog)
    if page_id:
        q = q.where(CreditLog.page_id == page_id)
    q = q.order_by(CreditLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()
