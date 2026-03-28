"""
/api/auth — Login สำหรับ admin และ customer (JWT)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import LoginRequest, TokenResponse
from app.auth import authenticate_admin, authenticate_customer, create_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login รวม — ลอง admin ก่อน ถ้าไม่ใช่ก็ลอง customer
    ส่ง JWT กลับพร้อม role
    """
    # ลอง admin ก่อน
    admin = await authenticate_admin(body.email, body.password, db)
    if admin:
        token = create_token(admin.id, "admin", admin.name)
        return TokenResponse(
            access_token=token, role="admin", user_id=admin.id, name=admin.name
        )

    # ลอง customer
    customer = await authenticate_customer(body.email, body.password, db)
    if customer:
        if customer.status != "active":
            raise HTTPException(status_code=403, detail="บัญชีถูกระงับหรือหมดอายุ")
        token = create_token(customer.id, "customer", customer.name)
        return TokenResponse(
            access_token=token, role="customer", user_id=customer.id, name=customer.name
        )

    raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")
