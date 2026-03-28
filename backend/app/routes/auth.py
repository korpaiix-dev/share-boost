"""
/api/auth — Login (JWT) + Facebook OAuth
"""
import urllib.parse
import urllib.request
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import LoginRequest, TokenResponse
from app.auth import authenticate_admin, authenticate_customer, create_token
from app.models import Page, Customer
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# ────────────────────────────────────────
# Login
# ────────────────────────────────────────

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


# ────────────────────────────────────────
# Facebook OAuth
# ────────────────────────────────────────

FB_OAUTH_SCOPES = (
    "pages_show_list,"
    "pages_manage_posts,"
    "pages_read_engagement,"
    "pages_manage_engagement,"
    "pages_messaging,"
    "pages_read_user_content,"
    "read_insights"
)


@router.get("/facebook")
async def facebook_oauth_redirect():
    """Redirect ไปหน้า Facebook OAuth เพื่อขอสิทธิ์"""
    if not settings.FB_APP_ID:
        raise HTTPException(status_code=500, detail="FB_APP_ID ยังไม่ได้ตั้งค่า")

    params = urllib.parse.urlencode({
        "client_id": settings.FB_APP_ID,
        "redirect_uri": settings.FB_REDIRECT_URI,
        "scope": FB_OAUTH_SCOPES,
        "response_type": "code",
        "state": "postpilot",
    })
    url = f"https://www.facebook.com/{settings.FB_API_VERSION}/dialog/oauth?{params}"
    return RedirectResponse(url=url)


@router.get("/facebook/callback")
async def facebook_oauth_callback(
    code: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Facebook OAuth callback:
    1. แลก code → short-lived token
    2. แลก short-lived → long-lived token (60 วัน)
    3. ดึงรายชื่อเพจ + page access tokens
    4. บันทึกลง DB
    5. Redirect กลับ frontend
    """
    frontend = settings.FRONTEND_URL

    if error or not code:
        return RedirectResponse(url=f"{frontend}/dashboard/settings?connected=false&error=denied")

    try:
        # ─── Step 1: แลก code → short-lived token ───
        params = urllib.parse.urlencode({
            "client_id": settings.FB_APP_ID,
            "client_secret": settings.FB_APP_SECRET,
            "redirect_uri": settings.FB_REDIRECT_URI,
            "code": code,
        })
        token_url = f"https://graph.facebook.com/{settings.FB_API_VERSION}/oauth/access_token?{params}"
        req = urllib.request.Request(token_url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            token_data = json.loads(resp.read().decode())

        short_token = token_data["access_token"]

        # ─── Step 2: แลก short-lived → long-lived token ───
        params = urllib.parse.urlencode({
            "grant_type": "fb_exchange_token",
            "client_id": settings.FB_APP_ID,
            "client_secret": settings.FB_APP_SECRET,
            "fb_exchange_token": short_token,
        })
        ll_url = f"https://graph.facebook.com/{settings.FB_API_VERSION}/oauth/access_token?{params}"
        req = urllib.request.Request(ll_url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            ll_data = json.loads(resp.read().decode())

        long_token = ll_data["access_token"]

        # ─── Step 3: ดึงรายชื่อเพจ ───
        pages_url = (
            f"https://graph.facebook.com/{settings.FB_API_VERSION}/me/accounts"
            f"?access_token={long_token}"
            f"&fields=id,name,access_token"
        )
        req = urllib.request.Request(pages_url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            pages_data = json.loads(resp.read().decode())

        pages_list = pages_data.get("data", [])
        if not pages_list:
            return RedirectResponse(url=f"{frontend}/dashboard/settings?connected=false&error=no_pages")

        # ─── Step 4: บันทึกลง DB ───
        for fb_page in pages_list:
            fb_page_id = fb_page["id"]
            page_name = fb_page["name"]
            page_token = fb_page["access_token"]

            # เช็คว่าเพจนี้มีในระบบแล้วหรือยัง
            existing = await db.execute(
                select(Page).where(Page.fb_page_id == fb_page_id)
            )
            existing_page = existing.scalar_one_or_none()

            if existing_page:
                # อัพเดท token ใหม่
                existing_page.access_token = page_token
                existing_page.page_name = page_name
            else:
                # สร้างเพจใหม่ — ผูกกับ customer คนแรกที่ active
                cust_result = await db.execute(
                    select(Customer).where(Customer.status == "active").limit(1)
                )
                customer = cust_result.scalar_one_or_none()
                if not customer:
                    return RedirectResponse(
                        url=f"{frontend}/dashboard/settings?connected=false&error=no_customer"
                    )

                new_page = Page(
                    customer_id=customer.id,
                    fb_page_id=fb_page_id,
                    page_name=page_name,
                    access_token=page_token,
                )
                db.add(new_page)

        await db.commit()
        return RedirectResponse(url=f"{frontend}/dashboard/settings?connected=true")

    except Exception as e:
        print(f"❌ Facebook OAuth Error: {e}")
        return RedirectResponse(url=f"{frontend}/dashboard/settings?connected=false&error=oauth_failed")
