"""
SQLAlchemy Models — ตาม schema ใน PROJECT.md
"""
import enum
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import (
    String, Integer, Float, Boolean, Text, DateTime, Enum, ForeignKey, JSON, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# === Enums ===

class PackageType(str, enum.Enum):
    standard = "standard"
    business = "business"
    vip = "vip"


class CustomerStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    expired = "expired"


class PageStatus(str, enum.Enum):
    active = "active"
    paused = "paused"


class CaptionStyle(str, enum.Enum):
    sexy = "sexy"
    cute = "cute"
    funny = "funny"
    sell = "sell"
    classy = "classy"


class PostStatus(str, enum.Enum):
    queued = "queued"
    posted = "posted"
    failed = "failed"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"


# === Helpers ===

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# === Models ===

class Admin(Base):
    """บัญชีแอดมิน (แยกจาก customer)"""
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), default="Admin")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Customer(Base):
    """ลูกค้าที่สมัครใช้บริการ"""
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    package: Mapped[PackageType] = mapped_column(Enum(PackageType), default=PackageType.standard)
    status: Mapped[CustomerStatus] = mapped_column(Enum(CustomerStatus), default=CustomerStatus.active)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relations
    pages: Mapped[List["Page"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship(back_populates="customer", cascade="all, delete-orphan")


class Page(Base):
    """เพจ Facebook ที่ผูกกับลูกค้า"""
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    fb_page_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    page_name: Mapped[str] = mapped_column(String(255), nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    caption_style: Mapped[CaptionStyle] = mapped_column(Enum(CaptionStyle), default=CaptionStyle.classy)
    keywords: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    auto_post: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_comment: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_chat: Mapped[bool] = mapped_column(Boolean, default=False)
    post_times: Mapped[Optional[dict]] = mapped_column(JSON, default=lambda: ["12:00", "19:00"])
    status: Mapped[PageStatus] = mapped_column(Enum(PageStatus), default=PageStatus.active)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relations
    customer: Mapped["Customer"] = relationship(back_populates="pages")
    posts: Mapped[List["Post"]] = relationship(back_populates="page", cascade="all, delete-orphan")
    comments_log: Mapped[List["CommentLog"]] = relationship(back_populates="page", cascade="all, delete-orphan")
    chat_log: Mapped[List["ChatLog"]] = relationship(back_populates="page", cascade="all, delete-orphan")
    credit_log: Mapped[List["CreditLog"]] = relationship(back_populates="page", cascade="all, delete-orphan")


class Post(Base):
    """โพสต์ที่ AI สร้างหรือกำลังจะโพสต์"""
    __tablename__ = "posts"
    __table_args__ = (Index("ix_posts_page_status", "page_id", "status"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    page_id: Mapped[int] = mapped_column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    fb_post_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    caption: Mapped[str] = mapped_column(Text, nullable=False)
    media_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # photo, video, album, text
    media_filename: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[PostStatus] = mapped_column(Enum(PostStatus), default=PostStatus.queued)
    posted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    engagement_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relations
    page: Mapped["Page"] = relationship(back_populates="posts")


class CommentLog(Base):
    """บันทึกคอมเมนต์ + คำตอบ AI"""
    __tablename__ = "comments_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    page_id: Mapped[int] = mapped_column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    fb_comment_id: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    commenter_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comment_text: Mapped[str] = mapped_column(Text, nullable=False)
    reply_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relations
    page: Mapped["Page"] = relationship(back_populates="comments_log")


class ChatLog(Base):
    """บันทึกแชท Messenger + คำตอบ AI"""
    __tablename__ = "chat_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    page_id: Mapped[int] = mapped_column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[str] = mapped_column(String(100), nullable=False)
    sender_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    reply_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relations
    page: Mapped["Page"] = relationship(back_populates="chat_log")


class CreditLog(Base):
    """บันทึกค่าใช้จ่าย AI (tokens + cost)"""
    __tablename__ = "credit_log"
    __table_args__ = (Index("ix_credit_page_created", "page_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    page_id: Mapped[int] = mapped_column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    agent_name: Mapped[str] = mapped_column(String(50), nullable=False)  # agent-mint, agent-pink, agent-fah, ...
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relations
    page: Mapped["Page"] = relationship(back_populates="credit_log")


class Payment(Base):
    """ประวัติการชำระเงิน"""
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # bank_transfer, promptpay, credit_card
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relations
    customer: Mapped["Customer"] = relationship(back_populates="payments")
