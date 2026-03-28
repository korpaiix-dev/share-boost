# PostPilot AI — Premium Facebook Page Management Service

## Vision
บริการดูแลเพจ Facebook ด้วย AI ระดับ Premium — ลูกค้าจ่ายแล้วนั่งดูผล ไม่ต้องทำอะไร

## Architecture
- **Admin Panel** (admin.postpilot.ai) — บอสจัดการลูกค้า+ระบบ
- **Client Dashboard** (app.postpilot.ai) — ลูกค้าดูผลงาน+อัพรูป
- **Backend API** — FastAPI + PostgreSQL
- **AI Workers** — Python scripts (โพสต์/คอมเม้น/แชท/วิเคราะห์)

## Tech Stack
- Frontend: Next.js 16 + React 19 + Tailwind CSS 4
- Backend: FastAPI (Python) + PostgreSQL
- AI: OpenRouter (Gemini 2.5 Flash) + Facebook Graph API v21
- Auth: JWT (admin) + customer login
- Deploy: Docker on DigitalOcean VPS

## Database Schema (PostgreSQL)

### customers
- id, name, email, phone, password_hash
- package (standard/business/vip), status (active/suspended/expired)
- created_at, expires_at

### pages  
- id, customer_id, fb_page_id, page_name, access_token
- caption_style (sexy/cute/funny/sell/classy), keywords
- auto_post (bool), auto_comment (bool), auto_chat (bool)
- post_times (JSON array: ["12:00","19:00"])
- status (active/paused)

### posts
- id, page_id, fb_post_id, caption, media_type, media_filename
- status (queued/posted/failed), posted_at, engagement_data (JSON)

### comments_log
- id, page_id, fb_comment_id, commenter_name, comment_text
- reply_text, replied_at

### chat_log
- id, page_id, sender_id, sender_name, message_text
- reply_text, replied_at

### credit_log
- id, page_id, agent_name, action, model
- tokens_in, tokens_out, cost_usd, created_at

### payments
- id, customer_id, amount, method, status, paid_at

## Packages
| Package | Price/mo | Pages | Posts/day | Features |
|---|---|---|---|---|
| Standard | ฿5,990 | 1 | 1 | โพสต์+คอมเม้น+รายงาน |
| Business | ฿9,990 | 2 | 2 | +แชท+แชร์กลุ่ม |
| VIP | ฿14,990 | 3 | ไม่จำกัด | ทุกอย่าง+dedicated support |

## Admin Panel Features
- Dashboard: ลูกค้าทั้งหมด, รายได้, ค่าใช้จ่าย AI
- Customer Management: เพิ่ม/แก้/ระงับ
- Page Setup: เชื่อมเพจ+Token+ตั้งค่าให้ลูกค้า
- Agent Monitor: สถานะ AI ทั้ง 5 ตัว
- Credit Report: ค่าใช้จ่าย AI ต่อลูกค้า
- Payment History: ยอดรับ

## Client Dashboard Features
- Overview: สถิติเพจวันนี้ (reach, engagement)
- Posts: ดูโพสต์ที่ AI ลง + แก้แคปชั่นก่อนโพสต์
- Media: อัพรูป/วิดีโอเข้าคลัง
- Comments: ดูคอมเม้น+คำตอบ AI
- Chat: ดูแชท Messenger+คำตอบ AI  
- Reports: รายงานสรุปประจำสัปดาห์
- Settings: เลือกสไตล์คอนเทนต์, keyword

## AI Agents (5 ตัว)
1. **น้องมิ้นท์** 🐱 Content Writer — คิดแคปชั่น+โพสต์ (Gemini Flash)
2. **น้องท็อป** 🐶 Scheduler — จัดตารางโพสต์
3. **น้องฟ้า** 🦊 Analyst — วิเคราะห์สถิติ+รายงาน
4. **น้องพิ้งค์** 🐰 Responder — ตอบคอมเม้น
5. **พี่ลีโอ** 🦁 Manager — ดูแลระบบ+แจ้งเตือน

## Directory Structure
```
postpilot/
├── frontend/           ← Next.js (Admin + Client)
│   ├── src/app/
│   │   ├── admin/      ← Admin Panel pages
│   │   ├── dashboard/  ← Client Dashboard pages  
│   │   ├── login/      ← Login (admin+client)
│   │   └── api/        ← API routes
│   ├── src/components/
│   │   ├── admin/      ← Admin components
│   │   └── client/     ← Client components
│   └── src/lib/
├── backend/            ← FastAPI + Workers
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── routes/
│   │   └── services/
│   ├── workers/
│   │   ├── post_facebook.py
│   │   ├── reply_comments.py
│   │   ├── reply_messenger.py
│   │   └── analyze_page.py
│   └── requirements.txt
├── docker-compose.yml
├── PROJECT.md
└── .env.example
```
