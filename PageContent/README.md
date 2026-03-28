# OpenClaw — PageContent (Python Auto-Posting System)

ระบบโพสต์ Facebook อัตโนมัติ พร้อม AI สร้างแคปชั่น

## ไฟล์หลัก

| ไฟล์ | คำอธิบาย |
|---|---|
| `post_facebook.py` | สคริปต์โพสต์อัตโนมัติ (หัวใจหลัก) |
| `reply_comments.py` | ระบบตอบคอมเมนต์อัตโนมัติ |
| `analyze_page.py` | วิเคราะห์ผลเพจ |
| `health_check.py` | Health monitoring |
| `facebook_system_prompt.txt` | System prompt สำหรับ AI |

## Setup

### 1. สร้าง Config Files
```bash
cp dashboard_config.example.json ~/PageContent/dashboard_config.json
cp .env.example ~/.openclaw/.env
mkdir -p ~/.openclaw/agents/main/agent
cp auth-profiles.example.json ~/.openclaw/agents/main/agent/auth-profiles.json
# แก้ไขใส่ค่าจริงในแต่ละไฟล์
```

### 2. สร้างโฟลเดอร์ Media
```bash
mkdir -p ~/PageContent/pages/main/photos
mkdir -p ~/PageContent/pages/main/videos
```

### 3. ตั้ง Cron (ดูตัวอย่างใน crontab.txt)
```bash
crontab -e
```

## Caption Styles
- `sexy` — เซ็กซี่ น่าดึงดูด
- `cute` — น่ารัก สดใส
- `funny` — ขำขัน ตลก
- `sell` — กระตุ้นยอดขาย
- `classy` — หรูหรา พรีเมียม

## Dependencies
- Python 3.x (ใช้ standard library เท่านั้น ไม่ต้อง pip install)
- OpenRouter API Key (สำหรับ AI สร้างแคปชั่น)
- Facebook Page Access Token
