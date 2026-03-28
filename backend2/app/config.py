"""
การตั้งค่าระบบ — อ่านจาก environment variables
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ฐานข้อมูล
    DATABASE_URL: str = "postgresql+asyncpg://postpilot:postpilot123@db:5432/postpilot"

    # JWT
    JWT_SECRET: str = "change-me-in-production-please"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 ชั่วโมง

    # Admin account (สร้างอัตโนมัติตอน startup)
    ADMIN_EMAIL: str = "admin@postpilot.ai"
    ADMIN_PASSWORD: str = "admin123"

    # Facebook Graph API
    FB_API_VERSION: str = "v21.0"
    FB_APP_ID: Optional[str] = None
    FB_APP_SECRET: Optional[str] = None

    # OpenRouter AI
    OPENROUTER_API_KEY: Optional[str] = None
    AI_MODEL: str = "google/gemini-2.5-flash"

    # File upload
    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
