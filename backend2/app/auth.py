"""
JWT Authentication — แยก admin กับ customer
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Admin, Customer

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: int, role: str, name: str) -> str:
    """สร้าง JWT token พร้อมระบุ role (admin/customer)"""
    payload = {
        "sub": str(user_id),
        "role": role,
        "name": name,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """ถอดรหัส JWT token"""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token หมดอายุแล้ว")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token ไม่ถูกต้อง")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """ดึงข้อมูล user จาก token (ใช้ได้ทั้ง admin และ customer)"""
    payload = decode_token(credentials.credentials)
    return {
        "user_id": int(payload["sub"]),
        "role": payload["role"],
        "name": payload.get("name", ""),
    }


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """บังคับว่าต้องเป็น admin เท่านั้น"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="ต้องเป็น Admin เท่านั้น")
    return user


async def require_customer(user: dict = Depends(get_current_user)) -> dict:
    """บังคับว่าต้องเป็น customer เท่านั้น"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="ต้องเป็น Customer เท่านั้น")
    return user


async def authenticate_admin(email: str, password: str, db: AsyncSession) -> Optional[Admin]:
    """ตรวจสอบ login admin"""
    result = await db.execute(select(Admin).where(Admin.email == email))
    admin = result.scalar_one_or_none()
    if admin and verify_password(password, admin.password_hash):
        return admin
    return None


async def authenticate_customer(email: str, password: str, db: AsyncSession) -> Optional[Customer]:
    """ตรวจสอบ login customer"""
    result = await db.execute(select(Customer).where(Customer.email == email))
    customer = result.scalar_one_or_none()
    if customer and verify_password(password, customer.password_hash):
        return customer
    return None


async def ensure_admin_exists(db: AsyncSession):
    """สร้าง admin account ถ้ายังไม่มี (เรียกตอน startup)"""
    result = await db.execute(select(Admin).where(Admin.email == settings.ADMIN_EMAIL))
    if not result.scalar_one_or_none():
        admin = Admin(
            email=settings.ADMIN_EMAIL,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            name="PostPilot Admin",
        )
        db.add(admin)
        await db.commit()
