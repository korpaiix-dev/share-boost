"""
PostPilot AI — FastAPI Backend
เซิร์ฟเวอร์หลักที่รวม routes ทั้งหมด
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, async_session
from app.auth import ensure_admin_exists
from app.routes import auth, admin, customers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """สร้างตาราง + admin account ตอน startup"""
    await init_db()
    async with async_session() as db:
        await ensure_admin_exists(db)
    print("✅ PostPilot API พร้อมใช้งาน")
    yield
    print("👋 PostPilot API ปิดตัว")


app = FastAPI(
    title="PostPilot AI API",
    description="Premium Facebook Page Management Service",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — อนุญาต frontend ทุก origin (production ควรจำกัด)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# รวม routes ทั้งหมด
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(customers.router)


@app.get("/")
async def root():
    return {"service": "PostPilot AI", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
