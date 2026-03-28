"""
Pydantic Schemas — สำหรับ request/response validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# === Auth ===

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str  # "admin" หรือ "customer"
    user_id: int
    name: str


# === Customer ===

class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(min_length=6)
    package: str = "standard"


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    package: Optional[str] = None
    status: Optional[str] = None
    expires_at: Optional[datetime] = None


class CustomerOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    package: str
    status: str
    created_at: datetime
    expires_at: Optional[datetime]
    pages_count: int = 0

    model_config = {"from_attributes": True}


class CustomerProfile(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    package: str
    status: str
    created_at: datetime
    expires_at: Optional[datetime]

    model_config = {"from_attributes": True}


# === Page ===

class PageCreate(BaseModel):
    customer_id: int
    fb_page_id: str
    page_name: str
    access_token: str
    caption_style: str = "classy"
    keywords: Optional[str] = None
    auto_post: bool = True
    auto_comment: bool = True
    auto_chat: bool = False
    post_times: Optional[List[str]] = None


class PageUpdate(BaseModel):
    page_name: Optional[str] = None
    access_token: Optional[str] = None
    caption_style: Optional[str] = None
    keywords: Optional[str] = None
    auto_post: Optional[bool] = None
    auto_comment: Optional[bool] = None
    auto_chat: Optional[bool] = None
    post_times: Optional[List[str]] = None
    status: Optional[str] = None


class PageOut(BaseModel):
    id: int
    customer_id: int
    fb_page_id: str
    page_name: str
    caption_style: str
    keywords: Optional[str]
    auto_post: bool
    auto_comment: bool
    auto_chat: bool
    post_times: Optional[list]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PageSettings(BaseModel):
    """สำหรับ customer แก้ไขการตั้งค่าเพจของตัวเอง"""
    caption_style: Optional[str] = None
    keywords: Optional[str] = None


# === Post ===

class PostOut(BaseModel):
    id: int
    page_id: int
    fb_post_id: Optional[str]
    caption: str
    media_type: Optional[str]
    media_filename: Optional[str]
    status: str
    posted_at: Optional[datetime]
    engagement_data: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


class PostUpdateCaption(BaseModel):
    caption: str = Field(min_length=1)


# === Comment ===

class CommentOut(BaseModel):
    id: int
    page_id: int
    fb_comment_id: str
    commenter_name: Optional[str]
    comment_text: str
    reply_text: Optional[str]
    replied_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# === Chat ===

class ChatOut(BaseModel):
    id: int
    page_id: int
    sender_id: str
    sender_name: Optional[str]
    message_text: str
    reply_text: Optional[str]
    replied_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# === Credit ===

class CreditLogOut(BaseModel):
    id: int
    page_id: int
    agent_name: str
    action: str
    model: str
    tokens_in: int
    tokens_out: int
    cost_usd: float
    created_at: datetime

    model_config = {"from_attributes": True}


# === Payment ===

class PaymentCreate(BaseModel):
    customer_id: int
    amount: float
    method: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    customer_id: int
    amount: float
    method: Optional[str]
    status: str
    paid_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# === Dashboard ===

class DashboardStats(BaseModel):
    total_customers: int
    active_customers: int
    total_pages: int
    active_pages: int
    total_posts_today: int
    total_comments_today: int
    total_revenue: float
    total_ai_cost: float


class PageStats(BaseModel):
    """สถิติ engagement ของเพจ"""
    total_posts: int
    posts_today: int
    total_comments: int
    comments_today: int
    total_chats: int
    ai_cost_total: float
    ai_cost_today: float
    recent_engagement: Optional[dict] = None
