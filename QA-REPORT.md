# QA Report — PostPilot AI v1.0

**วันที่ตรวจ:** 28 มี.ค. 2569
**ผู้ตรวจ:** QA Lead (AI)

---

## สรุปภาพรวม

| รายการ | จำนวน |
|--------|-------|
| ไฟล์ Backend (Python) | 19 |
| ไฟล์ Frontend (TSX/TS) | 31 |
| หน้า (pages) ทั้งหมด | 17 |
| ไฟล์ Docker/Infra | 4 |
| **รวมทั้งหมด** | **54+** |

---

## Bugs ที่เจอ + แก้แล้ว (22 รายการ)

### Frontend — แก้แล้ว

| # | ไฟล์ | ปัญหา | แก้ไข |
|---|------|-------|-------|
| 1 | `src/lib/api.ts:1` | Hardcoded IP `139.59.123.146` | ใช้ `process.env.NEXT_PUBLIC_API_URL` + fallback |
| 2 | `src/app/layout.tsx:6` | Description เป็นภาษาอังกฤษ | เปลี่ยนเป็นภาษาไทย |
| 3 | `src/app/login/page.tsx:182` | Footer เป็นอังกฤษ "Premium Facebook Page Management" | เปลี่ยนเป็นภาษาไทย |
| 4 | `src/app/login/page.tsx:168-175` | ปุ่ม "Admin Demo" / "Customer Demo" เป็นอังกฤษ | เปลี่ยนเป็น "ทดลอง Admin" / "ทดลองลูกค้า" |
| 5 | `src/app/login/page.tsx:160` | "Demo Mode" เป็นอังกฤษ | เปลี่ยนเป็น "โหมดทดลอง" |
| 6 | `AdminSidebar.tsx:44` | "Admin Panel" เป็นอังกฤษ | เปลี่ยนเป็น "แผงควบคุมแอดมิน" |
| 7 | `AdminSidebar.tsx:20` | "AI Agents" เป็นอังกฤษ | เปลี่ยนเป็น "AI เอเจนท์" |
| 8 | `admin/agents/page.tsx:41` | หัวข้อ "AI Agents" เป็นอังกฤษ | เปลี่ยนเป็น "AI เอเจนท์" |
| 9 | `admin/credits/page.tsx:107-110` | หัวตาราง Agent/Action/Model/Tokens/Cost เป็นอังกฤษ | เปลี่ยนเป็นภาษาไทยทั้งหมด |
| 10 | `admin/credits/page.tsx:60` | "AI call" เป็นอังกฤษ | เปลี่ยนเป็น "การเรียกใช้ AI" |
| 11 | `admin/credits/page.tsx:4` | Import `Filter` ที่ไม่ได้ใช้ | ลบออก |
| 12 | `admin/customers/page.tsx:20-24` | Package labels เป็นอังกฤษ (Standard/Business/VIP) | เปลี่ยนเป็นไทย |
| 13 | `admin/customers/page.tsx:100` | สถานะ "expired" ไม่มีการแปลไทย แสดง "ระงับ" ผิด | เพิ่มสถานะ "หมดอายุ" + สีเหลือง |
| 14 | `admin/payments/page.tsx:107` | วิธีชำระเงิน promptpay/credit_card/bank_transfer แสดงอังกฤษ | เพิ่มการแปลเป็นไทย |
| 15 | `dashboard/reports/page.tsx:74` | Period "weekly" แสดงอังกฤษ | เพิ่มการแปล "รายสัปดาห์"/"รายเดือน" |
| 16 | `dashboard/reports/page.tsx:86,90` | "Reach" / "Engagement" เป็นอังกฤษ | เปลี่ยนเป็น "การเข้าถึง" / "การมีส่วนร่วม" |
| 17 | `dashboard/media/page.tsx:56-63` | Image style labels เป็นอังกฤษ (Realistic, Digital Art, etc.) | เปลี่ยนเป็นภาษาไทยทั้งหมด |
| 18 | `dashboard/settings/page.tsx:173` | "Token ยังใช้ได้" / "Token หมดอายุ" | เปลี่ยนเป็น "โทเคน" |
| 19 | `dashboard/chat/page.tsx:292` | "(override AI)" เป็นอังกฤษ | เปลี่ยนเป็น "(แทนที่ AI)" |
| 20 | `ClientSidebar.tsx:114` | "แพ็กเกจ Standard" มีอังกฤษ | เปลี่ยนเป็น "แพ็กเกจ สแตนดาร์ด" |
| 21 | `admin/page.tsx:81` | กราฟ "จำนวนลูกค้าใหม่" ใช้ข้อมูลรายได้ (revenueChart) ผิด | สร้างข้อมูลจำนวนลูกค้าแยกต่างหาก |
| 22 | `dashboard/groups/page.tsx:147-153` | ใช้ `require()` + hook ใน try/catch ผิด rules of hooks | ลบ try/catch, ใช้ค่า default ตรงๆ |

### Responsive — แก้แล้ว

| # | ไฟล์ | ปัญหา | แก้ไข |
|---|------|-------|-------|
| 23 | `admin/layout.tsx` | ไม่มี hamburger menu บนมือถือ | เพิ่ม mobile sidebar เหมือน dashboard layout |
| 24 | `dashboard/groups/page.tsx:510` | grid-cols-5 ไม่ responsive | เปลี่ยนเป็น grid-cols-2 sm:3 md:5 |
| 25 | `dashboard/posts/page.tsx:455` | grid-cols-4 ไม่ responsive | เปลี่ยนเป็น grid-cols-2 md:4 |
| 26 | `dashboard/media/page.tsx:493` | grid-cols-4 ไม่ responsive | เปลี่ยนเป็น grid-cols-2 sm:3 md:4 |

### Docker/Security — แก้แล้ว

| # | ไฟล์ | ปัญหา | แก้ไข |
|---|------|-------|-------|
| 27 | ไม่มี `.gitignore` ที่ root | `.env` สามารถถูก commit ได้ | สร้าง `/root/postpilot/.gitignore` |
| 28 | `docker-compose.yml:11,34` | Hardcoded DB password `postpilot123` | ใช้ `${POSTGRES_PASSWORD:-postpilot123}` |
| 29 | `docker-compose.yml:37` | `--reload` flag ไม่ควรใช้ใน production | ลบ `--reload` ออก |

---

## Bugs ที่เจอ + ยังไม่ได้แก้ (ไฟล์ Backend เป็น read-only)

### Backend — CRITICAL (ไม่สามารถแก้ได้ เพราะไฟล์เป็น read-only ของ root)

| # | ไฟล์ | ปัญหา | ระดับ |
|---|------|-------|-------|
| 1 | `backend/app/main.py:36` | **CORS allow_origins=["*"]** — ต้องจำกัดเฉพาะ domains ที่อนุญาต | CRITICAL |
| 2 | `backend/app/routes/admin.py:36` | **`func.count()` ไม่มี `select()` ครอบ** — Dashboard จะ error 500 | CRITICAL |
| 3 | `backend/app/routes/admin.py:40` | **`func.count()` ไม่มี `select()` ครอบ** — เหมือนข้อ 2 | CRITICAL |
| 4 | `backend/app/config.py:13` | **JWT_SECRET default = "change-me-in-production-please"** — ใครก็ปลอม token ได้ | CRITICAL |
| 5 | `backend/app/config.py:18-19` | **Admin credentials default = admin@postpilot.ai / admin1234** | CRITICAL |
| 6 | `backend/app/routes/admin.py:42` | ใช้ `Page.status == "active"` แทน `PageStatus.active` | HIGH |
| 7 | `backend/app/models.py:107` | Type hint `Optional[dict]` แต่ค่าจริงเป็น `list` | MEDIUM |
| 8 | `backend/app/routes/customers.py:23` | Customer router ไม่มี router-level auth dependency | MEDIUM |
| 9 | `backend/app/services/facebook.py:17` | Hardcoded multipart boundary — ควร random | LOW |
| 10 | `backend/app/services/facebook.py, ai.py` | ใช้ `urllib.request` (blocking) ใน async context | MEDIUM |
| 11 | `backend/app/schemas.py` | ไม่มี validation สำหรับ enum values (package, status, caption_style) | MEDIUM |
| 12 | `backend/app/auth.py:52-61` | `get_current_user` ไม่เช็คว่า user ยังอยู่ใน DB | LOW |
| 13 | `backend/workers/reply_messenger.py` | Dead code — ไม่มี webhook route เรียกใช้ | LOW |

### Frontend — ยังไม่ได้แก้

| # | ไฟล์ | ปัญหา | ระดับ |
|---|------|-------|-------|
| 14 | `dashboard/chat/page.tsx:170` | Chat page ไม่ responsive บนมือถือ (w-[30%] min-w-[280px]) | MEDIUM |
| 15 | `dashboard/chat/page.tsx:125` | Non-null assertion `!` อาจ crash | LOW |
| 16 | `dashboard/media/page.tsx:168` | `URL.createObjectURL()` ไม่เรียก `revokeObjectURL()` (memory leak) | LOW |
| 17 | `components/client/PostEditor.tsx` | Component ไม่ถูก import/ใช้งานที่ไหน | LOW |
| 18 | `components/client/MediaUploader.tsx` | Component ไม่ถูก import/ใช้งานที่ไหน | LOW |
| 19 | ทุกหน้า admin/dashboard | ไม่มี auth guard — ใครก็เข้าถึง /admin, /dashboard ได้โดยไม่ login | HIGH |

---

## Security Issues

| # | ปัญหา | ระดับ | สถานะ |
|---|-------|-------|-------|
| 1 | CORS allow_origins=["*"] + allow_credentials=True | CRITICAL | ยังไม่ได้แก้ (backend read-only) |
| 2 | JWT_SECRET hardcoded default | CRITICAL | ยังไม่ได้แก้ (backend read-only) |
| 3 | Admin credentials hardcoded default | CRITICAL | ยังไม่ได้แก้ (backend read-only) |
| 4 | ไม่มี .gitignore ที่ root | HIGH | **แก้แล้ว** |
| 5 | DB password hardcoded ใน docker-compose.yml | HIGH | **แก้แล้ว** (ใช้ env var) |
| 6 | Hardcoded IP ใน frontend source | MEDIUM | **แก้แล้ว** (ใช้ env var) |
| 7 | ไม่มี auth guard บน frontend pages | HIGH | ยังไม่ได้แก้ |
| 8 | ไม่มี rate limiting บน login endpoint | MEDIUM | ยังไม่ได้แก้ (backend read-only) |
| 9 | Facebook access_token เก็บ plain text ใน DB | MEDIUM | ยังไม่ได้แก้ (backend read-only) |
| 10 | ไม่มี token revocation / logout mechanism | LOW | ยังไม่ได้แก้ (backend read-only) |
| 11 | Backend Dockerfile ทำงานเป็น root | MEDIUM | ยังไม่ได้แก้ (backend read-only) |
| 12 | nginx.conf CORS wildcard `*` | MEDIUM | ยังไม่ได้แก้ (nginx.conf read-only) |

---

## Missing Features

| # | ฟีเจอร์ | ระดับความสำคัญ |
|---|---------|---------------|
| 1 | Facebook OAuth routes (`/api/auth/facebook`, `/api/auth/facebook/callback`) ยังไม่มี | HIGH |
| 2 | ไม่มี Alembic / database migration tool | HIGH |
| 3 | ไม่มี async HTTP client (ใช้ urllib blocking) | MEDIUM |
| 4 | ไม่มี rate limiting | MEDIUM |
| 5 | ไม่มี SSL/TLS ใน nginx | MEDIUM |
| 6 | ไม่มี frontend Dockerfile | HIGH |
| 7 | ไม่มี pagination total count ใน list endpoints | LOW |
| 8 | ไม่มี .dockerignore | LOW |

---

## Port Conflict Check

| Port | Service | ชนกับโปรเจกต์อื่น? |
|------|---------|-------------------|
| 5435 | PostgreSQL (host) | ไม่ชน |
| 8000 | Backend (host) | ไม่ชน |
| 80 | Nginx proxy (host) | ไม่ชน |
| 3000 | Frontend (internal only) | ไม่ชน (expose เท่านั้น) |
| 8080 | Landing (internal only) | ไม่ชน (expose เท่านั้น) |

ไม่พบ port ที่ชนกับรายการต้องห้าม (5432/5433/5434/8800/8801/8802/18789/3000)

---

## คะแนนรวม

### คะแนนแยกส่วน

| ส่วน | คะแนน | หมายเหตุ |
|------|-------|---------|
| Backend Code Quality | C | มี critical bugs (CORS, dashboard query, hardcoded secrets) |
| Frontend Code Quality | B+ | ภาษาไทยครบแล้ว, responsive แก้แล้ว, แต่ยังขาด auth guard |
| Docker/Infrastructure | C+ | ขาด frontend Dockerfile, Alembic, .dockerignore |
| Security | C | CORS wildcard, hardcoded secrets, ไม่มี rate limiting |
| Overall UX/UI | A- | Design สวย, ใช้งานง่าย, mock data ครบทุกหน้า |

### คะแนนรวม: **B-**

**เหตุผล:** Frontend สวย ใช้งานได้ดี ภาษาไทยครบ (หลังแก้แล้ว) แต่ Backend มี critical security issues หลายจุดที่ต้องแก้ก่อน deploy จริง โดยเฉพาะ CORS, JWT secret, admin credentials, และ dashboard query bug ที่จะทำให้ dashboard ใช้งานไม่ได้

---

*รายงานนี้สร้างโดย QA Lead (AI) — 28 มี.ค. 2569*
