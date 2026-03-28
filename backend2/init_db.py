"""
init_db.py — Seed ข้อมูลเริ่มต้น
- 1 admin user
- 3 demo customers (ร้านเสื้อผ้าพี่เจน, ร้านกาแฟ, คลินิกหมอสวย)
- 6 demo pages (2 เพจต่อ customer)
"""
import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import select

from app.config import settings
from app.database import engine, async_session, Base
from app.auth import hash_password
from app.models import Admin, Customer, Page, CustomerStatus, PackageType, CaptionStyle, PageStatus


async def seed():
    # สร้างตารางทั้งหมด
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ สร้างตารางเรียบร้อย")

    async with async_session() as db:
        # === 1. Admin ===
        result = await db.execute(select(Admin).where(Admin.email == settings.ADMIN_EMAIL))
        if not result.scalar_one_or_none():
            admin = Admin(
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                name="PostPilot Admin",
            )
            db.add(admin)
            await db.flush()
            print(f"✅ สร้าง Admin: {settings.ADMIN_EMAIL}")
        else:
            print(f"⏭️  Admin มีอยู่แล้ว: {settings.ADMIN_EMAIL}")

        # === 2. Demo Customers ===
        demo_customers = [
            {
                "name": "พี่เจน — ร้านเสื้อผ้า",
                "email": "jen@demo.postpilot.ai",
                "phone": "081-234-5678",
                "password": "demo1234",
                "package": PackageType.vip,
            },
            {
                "name": "คุณบอส — ร้านกาแฟ CoffeeBoss",
                "email": "boss@demo.postpilot.ai",
                "phone": "089-876-5432",
                "password": "demo1234",
                "package": PackageType.business,
            },
            {
                "name": "หมอสวย — คลินิกความงาม",
                "email": "drsuay@demo.postpilot.ai",
                "phone": "062-999-8888",
                "password": "demo1234",
                "package": PackageType.standard,
            },
        ]

        customer_ids = []
        for c_data in demo_customers:
            result = await db.execute(select(Customer).where(Customer.email == c_data["email"]))
            existing = result.scalar_one_or_none()
            if existing:
                customer_ids.append(existing.id)
                print(f"⏭️  Customer มีอยู่แล้ว: {c_data['email']}")
                continue

            customer = Customer(
                name=c_data["name"],
                email=c_data["email"],
                phone=c_data["phone"],
                password_hash=hash_password(c_data["password"]),
                package=c_data["package"],
                status=CustomerStatus.active,
                expires_at=datetime.now(timezone.utc) + timedelta(days=30),
            )
            db.add(customer)
            await db.flush()
            await db.refresh(customer)
            customer_ids.append(customer.id)
            print(f"✅ สร้าง Customer: {c_data['name']} ({c_data['email']})")

        # === 3. Demo Pages (2 เพจต่อ customer) ===
        demo_pages = [
            # พี่เจน — ร้านเสื้อผ้า
            {
                "customer_idx": 0,
                "fb_page_id": "demo_jen_fashion",
                "page_name": "Jen Fashion | เสื้อผ้าแฟชั่นพี่เจน",
                "access_token": "DEMO_TOKEN_JEN_1",
                "caption_style": CaptionStyle.sexy,
                "keywords": "เสื้อผ้าแฟชั่น,ชุดสวย,ราคาถูก",
                "auto_post": True,
                "auto_comment": True,
            },
            {
                "customer_idx": 0,
                "fb_page_id": "demo_jen_outlet",
                "page_name": "Jen Outlet | ลดราคาจัดหนัก",
                "access_token": "DEMO_TOKEN_JEN_2",
                "caption_style": CaptionStyle.sell,
                "keywords": "ลดราคา,โปรโมชั่น,sale",
                "auto_post": True,
                "auto_comment": False,
            },
            # คุณบอส — ร้านกาแฟ
            {
                "customer_idx": 1,
                "fb_page_id": "demo_coffeeboss",
                "page_name": "CoffeeBoss | กาแฟดีมีสไตล์",
                "access_token": "DEMO_TOKEN_BOSS_1",
                "caption_style": CaptionStyle.classy,
                "keywords": "กาแฟ,คาเฟ่,ลาเต้,เอสเพรสโซ",
                "auto_post": True,
                "auto_comment": True,
            },
            {
                "customer_idx": 1,
                "fb_page_id": "demo_coffeeboss_delivery",
                "page_name": "CoffeeBoss Delivery | สั่งเดลิเวอรี่",
                "access_token": "DEMO_TOKEN_BOSS_2",
                "caption_style": CaptionStyle.funny,
                "keywords": "เดลิเวอรี่,สั่งกาแฟ,โปรส่งฟรี",
                "auto_post": False,
                "auto_comment": True,
            },
            # หมอสวย — คลินิก
            {
                "customer_idx": 2,
                "fb_page_id": "demo_drsuay_clinic",
                "page_name": "Dr.Suay Clinic | คลินิกหมอสวย",
                "access_token": "DEMO_TOKEN_DR_1",
                "caption_style": CaptionStyle.classy,
                "keywords": "คลินิกความงาม,โบท็อกซ์,ฟิลเลอร์,หน้าใส",
                "auto_post": True,
                "auto_comment": True,
            },
            {
                "customer_idx": 2,
                "fb_page_id": "demo_drsuay_skincare",
                "page_name": "Dr.Suay Skincare | สกินแคร์หมอสวย",
                "access_token": "DEMO_TOKEN_DR_2",
                "caption_style": CaptionStyle.cute,
                "keywords": "สกินแคร์,ครีมหน้าใส,เซรั่ม",
                "auto_post": True,
                "auto_comment": False,
            },
        ]

        for p_data in demo_pages:
            cust_id = customer_ids[p_data["customer_idx"]]
            result = await db.execute(
                select(Page).where(Page.fb_page_id == p_data["fb_page_id"])
            )
            if result.scalar_one_or_none():
                print(f"⏭️  Page มีอยู่แล้ว: {p_data['page_name']}")
                continue

            page = Page(
                customer_id=cust_id,
                fb_page_id=p_data["fb_page_id"],
                page_name=p_data["page_name"],
                access_token=p_data["access_token"],
                caption_style=p_data["caption_style"],
                keywords=p_data["keywords"],
                auto_post=p_data["auto_post"],
                auto_comment=p_data["auto_comment"],
                auto_chat=False,
                post_times=["12:00", "19:00"],
                status=PageStatus.active,
            )
            db.add(page)
            await db.flush()
            print(f"✅ สร้าง Page: {p_data['page_name']}")

        await db.commit()
        print("\n🎉 Seed ข้อมูลเริ่มต้นเรียบร้อย!")
        print(f"   Admin: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
        print(f"   Demo customers: 3 ราย (password: demo1234)")
        print(f"   Demo pages: 6 เพจ")


if __name__ == "__main__":
    asyncio.run(seed())
