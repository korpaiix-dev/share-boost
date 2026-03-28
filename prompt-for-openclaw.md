# PostPilot AI — สรุปโปรเจกต์สำหรับพัฒนาต่อ

## ภาพรวม
PostPilot AI (เดิมชื่อ ShareBoost v1.5) เป็น Electron App สำหรับร้านค้าออนไลน์/ธุรกิจขนาดเล็กในไทย ใช้จัดการ Facebook อัตโนมัติ ทั้งแชร์โพสต์ไปกลุ่ม, จัดการเพจ, AI แชทบอท, AI คอมเม้นท์บอท, สร้างรูป/วิดีโอด้วย AI

## Tech Stack
- **Electron** + React (Babel in-browser JSX compilation)
- **sql.js** (SQLite) เก็บข้อมูลในเครื่อง
- **Playwright-core** สำหรับ Facebook browser automation (Login, แชร์กลุ่ม)
- **Facebook Graph API** สำหรับจัดการเพจ, แชทบอท, คอมเม้นท์บอท, Insight
- **AI Providers**: OpenRouter/DeepSeek/OpenAI (ข้อความ), Stability AI/DALL-E/Replicate (รูป), Runway/Replicate/Kling AI (วิดีโอ)

## โครงสร้างไฟล์หลัก
```
app/
├── main.js              — Electron main process + IPC handlers ทั้งหมด
├── preload.js           — contextBridge (window.api)
├── package.json         — name: "postpilot-ai", version: "1.0.0"
├── electron-builder.yml — build config
├── src/
│   ├── renderer/
│   │   └── index.html   — UI ทั้งหมด (React + CSS inline, ~3000 บรรทัด)
│   ├── core/
│   │   ├── db.js        — SQLite database (tables: accounts, groups, categories, share_history, share_queue, settings, pages)
│   │   ├── facebook.js  — Playwright automation (login, fetchGroups, fetchPages, sharePost)
│   │   ├── graph-api.js — Facebook Graph API module (OAuth, posts, comments, messenger, insights)
│   │   ├── account.js   — Account management
│   │   ├── license.js   — License system
│   │   └── ai-caption.js — AI caption generation
│   └── shared/
│       └── constants.js — Default settings
```

## สถาปัตยกรรม 2 ระบบ
1. **Playwright** (เปิดเบราว์เซอร์จริง) — ใช้สำหรับ:
   - Login บัญชี Facebook (timeout 15 นาที รองรับ 2FA/OTP)
   - ดึงรายชื่อกลุ่ม
   - แชร์โพสต์ไปกลุ่มอัตโนมัติ
   - ค้นหาและเข้าร่วมกลุ่ม

2. **Facebook Graph API** (official API, เสถียร) — ใช้สำหรับ:
   - เชื่อมต่อเพจ (OAuth flow → Long-lived Token 60 วัน)
   - โพสต์ลงเพจ
   - อ่าน/ตอบ/ไลค์/ซ่อน คอมเม้นท์
   - Messenger (อ่าน/ส่งข้อความ)
   - Page Insights (การเข้าถึง, engagement, ผู้ติดตาม)

## OAuth Flow (เชื่อมต่อเพจ)
1. ผู้ใช้ใส่ Facebook App ID + App Secret ในหน้าตั้งค่า (ครั้งเดียว)
2. กดปุ่ม "เชื่อมต่อเพจ" → เปิดเบราว์เซอร์
3. Login Facebook → เลือกเพจ → กดอนุญาต
4. Redirect กลับ localhost:3847/callback → แลก code → Long-lived Token
5. ดึงรายชื่อเพจ + Page Access Token → บันทึกลง DB
6. ทุกหน้าอัปเดตผ่าน event 'pages-updated'

## Permissions ที่ขอ
pages_show_list, pages_read_engagement, pages_manage_posts, pages_manage_engagement, pages_messaging, pages_read_user_content, pages_manage_metadata, read_insights, business_management

## UI Pages (sidebar order)
1. แดชบอร์ด — สถิติรวม, ปุ่มลัด
2. สร้างโพสต์ — เขียนโพสต์ + AI สร้างรูป/วิดีโอ (50+ สไตล์)
3. แชร์โพสต์ — แชร์ไปกลุ่ม Facebook อัตโนมัติ (Playwright)
4. จัดการเพจ — ดูเพจที่เชื่อมต่อ + สถิติ
5. AI แชทบอท — ตอบ Messenger อัตโนมัติ
6. AI คอมเม้นท์ — ตอบคอมเม้นท์อัตโนมัติ + กรองสแปม
7. ตั้งค่า — บัญชี FB, Facebook App, เชื่อมต่อเพจ, AI API keys
8. License — ระบบ license ตาม tier

## สิ่งที่ทำเสร็จแล้ว
- ✅ UI ทั้งหมด (ภาษาไทย, dark theme)
- ✅ Login Facebook ผ่าน Playwright (15 นาที timeout)
- ✅ ดึงกลุ่ม + แชร์โพสต์ไปกลุ่มอัตโนมัติ
- ✅ ระบบ License (machine ID binding, tier-based)
- ✅ AI Caption generation
- ✅ Database schema ครบ (accounts, groups, pages, settings, etc.)
- ✅ Graph API module (graph-api.js) — OAuth, posts, comments, messenger, insights
- ✅ IPC handlers สำหรับ Graph API ครบ
- ✅ เชื่อมต่อเพจผ่าน OAuth (ทดสอบแล้ว ดึงเพจได้)
- ✅ ทุกหน้าเห็นเพจที่เชื่อมต่อแล้ว (event system)

## สิ่งที่ต้องทำต่อ
- ⬜ AI แชทบอท backend จริง — ใช้ Graph API polling/webhook อ่านข้อความ + ใช้ AI สร้างคำตอบ + ส่งกลับ
- ⬜ AI คอมเม้นท์บอท backend จริง — polling คอมเม้นท์ใหม่ + AI ตอบ + กรองสแปม + ไลค์อัตโนมัติ
- ⬜ หน้าจัดการเพจ — แสดงโพสต์ล่าสุด, Insight, โพสต์ลงเพจผ่าน Graph API
- ⬜ AI สร้างรูป/วิดีโอ backend จริง — เรียก Stability AI/DALL-E/Runway API
- ⬜ Webhook สำหรับ Messenger real-time (ถ้าต้องการ, ต้องมี public URL)
- ⬜ Token refresh — เตือนเมื่อ token ใกล้หมดอายุ (60 วัน)
- ⬜ Error handling ให้ครอบคลุมกว่านี้
- ⬜ Build + packaging สำหรับ Windows (.exe)

## ข้อควรระวัง (Critical)
- ใน index.html ต้องใช้ `appApi` (ไม่ใช่ `api`) เพราะ Babel compile `const api` เป็น `var api` ที่ global scope ซึ่ง conflict กับ contextBridge ที่ set `window.api` เป็น read-only
- ต้องใช้ `ReactDOM.createRoot()` (React 18) ไม่ใช่ `ReactDOM.render()`
- Page switching ใช้ CSS display:none/block (ไม่ใช่ conditional rendering) เพื่อไม่ให้ state หาย
- Facebook App ต้องอยู่ใน Live mode และผ่าน App Review สำหรับ permissions ที่ต้องการ
