#!/usr/bin/env python3
"""
น้องพิ้งค์ (Agent Pink) - Facebook Comment Auto-Responder
ดูแลเฉพาะโพสต์ที่ทีม Agent สร้างเท่านั้น (จาก posted.json)
รันทุก 30 นาทีผ่าน Cron
รองรับหลายเพจอัตโนมัติจาก dashboard_config.json
"""

import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timedelta, timezone

# === Paths ===
BASE_DIR = Path.home() / "PageContent"
CONFIG_FILE = BASE_DIR / "dashboard_config.json"
REPLIED_FILE = BASE_DIR / "replied.json"       # เก็บ comment_id ที่ตอบไปแล้ว (แชร์ทุกเพจ)
CREDIT_LOG = BASE_DIR / "credit_log.json"      # บันทึกค่าใช้จ่าย
POST_IDS_FILE = BASE_DIR / "post_ids.json"     # เก็บ Facebook Post IDs (legacy)
ENV_FILE = Path.home() / ".openclaw" / ".env"
AUTH_FILE = Path.home() / ".openclaw" / "agents" / "main" / "agent" / "auth-profiles.json"

# === Config ===
MAX_REPLIES_PER_PAGE = 5      # ตอบสูงสุดต่อเพจต่อรอบ
MAX_COMMENT_AGE_HOURS = 24   # ดูเฉพาะคอมเมนต์ไม่เกิน 24 ชม.

def load_env(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v

load_env(ENV_FILE)

with open(AUTH_FILE, "r") as f:
    auth_data = json.load(f)
OPENROUTER_API_KEY = auth_data.get("profiles", {}).get("openrouter:default", {}).get("key")

def load_json(path, default):
    if path.exists():
        try:
            with open(path, "r") as f: return json.load(f)
        except: pass
    return default

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_all_pages():
    """ดึงรายชื่อเพจทั้งหมดจาก dashboard_config.json"""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
            pages = []
            for p in config.get("pages", []):
                if p.get("pageId") and p.get("accessToken"):
                    pages.append({
                        "id": p.get("id", "main"),
                        "name": p.get("name", "Unknown"),
                        "pageId": p["pageId"],
                        "accessToken": p["accessToken"]
                    })
            return pages
        except: pass
    
    # Fallback: ถ้าไม่มี config ให้ใช้ .env
    fb_page_id = os.environ.get("FACEBOOK_PAGE_ID")
    fb_token = os.environ.get("FACEBOOK_ACCESS_TOKEN")
    if fb_page_id and fb_token:
        return [{"id": "main", "name": "เพจหลัก", "pageId": fb_page_id, "accessToken": fb_token}]
    return []

def get_replied_ids():
    return load_json(REPLIED_FILE, [])

def save_replied_ids(ids):
    save_json(REPLIED_FILE, ids)

def log_credit(action, tokens_in, tokens_out, cost, page_id="main"):
    logs = load_json(CREDIT_LOG, [])
    logs.append({
        "timestamp": datetime.now().isoformat(),
        "agent": "agent-pink",
        "action": action,
        "model": "gemini-2.5-flash",
        "pageId": page_id,
        "tokens_input": tokens_in,
        "tokens_output": tokens_out,
        "cost_usd": cost
    })
    save_json(CREDIT_LOG, logs)

def fetch_page_posts(fb_page_id, fb_token):
    """ดึงโพสต์ล่าสุดจากเพจ"""
    url = f"https://graph.facebook.com/v21.0/{fb_page_id}/posts?fields=id,created_time&limit=50&access_token={fb_token}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data.get("data", [])
    except Exception as e:
        print(f"    Error fetching posts: {e}")
        return []

def fetch_comments(post_id, fb_token):
    """ดึงคอมเมนต์ของโพสต์หนึ่งๆ"""
    url = f"https://graph.facebook.com/v21.0/{post_id}/comments?fields=id,from,message,created_time&limit=50&access_token={fb_token}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data.get("data", [])
    except Exception as e:
        print(f"    Error fetching comments for {post_id}: {e}")
        return []

def generate_reply(comment_text, commenter_name):
    """ให้ AI คิดคำตอบคอมเมนต์"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "google/gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": "คุณคือแอดมินเพจสาวสวย คอยตอบคอมเมนต์ลูกเพจแบบน่ารัก สุภาพ ขี้เล่นนิดๆ ไม่หยาบคาย\nกฎ:\n1. ตอบสั้นๆ 1-2 ประโยค ไม่เกิน 50 คำ\n2. ถ้าเขาชม ก็ขอบคุณน่ารักๆ\n3. ถ้าเขาถามเรื่องเข้ากลุ่ม ให้บอกว่ากดลิงก์ที่หน้าโปรไฟล์เลยค่ะ\n4. ถ้าเขาพูดหยาบคายหรือไม่เหมาะสม ให้ตอบสุภาพแต่ไม่ต้องสนใจเนื้อหา\n5. ห้ามส่งข้อความยาวเกิน 2 บรรทัด\n6. ส่งคำตอบเพียวๆ ไม่ต้องมีคำอธิบาย"},
            {"role": "user", "content": f"คอมเมนต์จาก {commenter_name}: \"{comment_text}\"\n\nตอบกลับ:"}
        ]
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            usage = result.get("usage", {})
            tokens_in = usage.get("prompt_tokens", 0)
            tokens_out = usage.get("completion_tokens", 0)
            cost = tokens_in * 0.00000015 + tokens_out * 0.0000006

            reply_text = "ขอบคุณที่แวะมาทักค่ะ 💕"
            if "choices" in result and len(result["choices"]) > 0:
                reply_text = result["choices"][0]["message"]["content"].strip()

            return reply_text, tokens_in, tokens_out, cost
    except Exception as e:
        print(f"    Error generating reply: {e}")

    return "ขอบคุณที่แวะมาทักค่ะ 💕", 0, 0, 0

def reply_to_comment(comment_id, reply_text, fb_token):
    """ตอบกลับคอมเมนต์บน Facebook"""
    url = f"https://graph.facebook.com/v21.0/{comment_id}/comments"
    data = json.dumps({
        "message": reply_text,
        "access_token": fb_token
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get("id") is not None
    except urllib.error.HTTPError as e:
        print(f"    Error replying ({e.code}): {e.read().decode('utf-8')}")
        return False

def is_recent(created_time_str):
    """ตรวจว่าคอมเมนต์อยู่ใน 24 ชม. ล่าสุดไหม"""
    try:
        ct = datetime.fromisoformat(created_time_str.replace('+0000', '+00:00'))
        now = datetime.now(timezone.utc)
        return (now - ct) < timedelta(hours=MAX_COMMENT_AGE_HOURS)
    except:
        return False

def process_single_page(page_info, replied_ids):
    """ตอบคอมเมนต์สำหรับเพจเดียว"""
    page_id = page_info["id"]
    page_name = page_info["name"]
    fb_page_id = page_info["pageId"]
    fb_token = page_info["accessToken"]
    
    print(f"\n  🐰 กำลังตรวจคอมเมนต์เพจ: {page_name}")
    
    # ดึงโพสต์ล่าสุด
    all_posts = fetch_page_posts(fb_page_id, fb_token)
    post_ids = [p["id"] for p in all_posts[:20]]
    print(f"    พบ {len(post_ids)} โพสต์")
    
    reply_count = 0
    
    for post_id in post_ids:
        if reply_count >= MAX_REPLIES_PER_PAGE:
            print(f"    ครบ {MAX_REPLIES_PER_PAGE} คอมเมนต์แล้ว หยุดเพจนี้")
            break

        comments = fetch_comments(post_id, fb_token)

        for comment in comments:
            if reply_count >= MAX_REPLIES_PER_PAGE:
                break

            comment_id = comment.get("id")
            comment_text = comment.get("message", "")
            commenter = comment.get("from", {}).get("name", "ลูกเพจ")
            created_time = comment.get("created_time", "")

            # Skip if already replied
            if comment_id in replied_ids:
                continue

            # Skip if too old
            if not is_recent(created_time):
                continue

            # Skip empty comments
            if not comment_text.strip():
                continue

            # Skip if commenter is our page (don't reply to ourselves)
            commenter_id = comment.get("from", {}).get("id", "")
            if commenter_id == fb_page_id:
                continue

            print(f"    💬 {commenter}: {comment_text[:50]}...")

            # Generate AI reply
            reply_text, tokens_in, tokens_out, cost = generate_reply(comment_text, commenter)
            print(f"    ↳ 🐰 ตอบ: {reply_text[:50]}...")

            # Log credit with pageId
            log_credit(f"ตอบคอมเมนต์: {commenter}", tokens_in, tokens_out, cost, page_id)

            # Post reply
            success = reply_to_comment(comment_id, reply_text, fb_token)
            if success:
                replied_ids.append(comment_id)
                reply_count += 1
                print(f"    ✅ ตอบสำเร็จ! ({reply_count}/{MAX_REPLIES_PER_PAGE})")
            else:
                print(f"    ❌ ตอบไม่สำเร็จ")

    return reply_count

def main():
    print(f"=== 🐰 น้องพิ้งค์ เริ่มทำงาน ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ===")

    pages = get_all_pages()
    if not pages:
        print("ไม่พบเพจที่ตั้งค่าไว้ กรุณาเพิ่มเพจในหน้า Settings")
        return

    print(f"พบ {len(pages)} เพจที่ต้องดูแล")
    
    replied_ids = get_replied_ids()
    total_replies = 0

    for page_info in pages:
        try:
            count = process_single_page(page_info, replied_ids)
            total_replies += count
        except Exception as e:
            print(f"  ❌ Error เพจ {page_info['name']}: {e}")

    save_replied_ids(replied_ids)
    print(f"\n=== 🐰 น้องพิ้งค์ เสร็จสิ้น (ตอบ {total_replies} คอมเมนต์ จาก {len(pages)} เพจ) ===\n")

if __name__ == "__main__":
    main()
