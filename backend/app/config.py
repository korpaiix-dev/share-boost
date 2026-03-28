"""
การตั้งค่าระบบ — อ่านจาก environment variables
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ฐานข้อมูล
    DATABASE_URL: str = "postgresql+asyncpg://postpilot:postpilot@localhost:5432/postpilot"

    # JWT
    JWT_SECRET: str = "change-me-in-production-please"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 ชั่วโมง

    # Admin account (สร้างอัตโนมัติตอน startup)
    ADMIN_EMAIL: str = "admin@postpilot.ai"
    ADMIN_PASSWORD: str = "admin1234"

    # Facebook Graph API
    FB_API_VERSION: str = "v21.0"

    # OpenRouter AI
    OPENROUTER_API_KEY: Optional[str] = None
    AI_MODEL: str = "google/gemini-2.5-flash"

    # File upload
    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
