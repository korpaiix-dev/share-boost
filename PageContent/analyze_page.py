#!/usr/bin/env python3
"""
น้องฟ้า (Agent Fah) - Daily Page Analytics
วิเคราะห์สถิติเพจ Facebook และสรุปรายงานประจำวัน
รันวันละ 1 ครั้ง เวลา 08:00
รองรับหลายเพจอัตโนมัติจาก dashboard_config.json
"""

import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

BASE_DIR = Path.home() / "PageContent"
CONFIG_FILE = BASE_DIR / "dashboard_config.json"
CREDIT_LOG = BASE_DIR / "credit_log.json"
ENV_FILE = Path.home() / ".openclaw" / ".env"
AUTH_FILE = Path.home() / ".openclaw" / "agents" / "main" / "agent" / "auth-profiles.json"

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

def log_credit(action, tokens_in, tokens_out, cost, page_id="main"):
    logs = load_json(CREDIT_LOG, [])
    logs.append({
        "timestamp": datetime.now().isoformat(),
        "agent": "agent-fah",
        "action": action,
        "model": "gemini-2.5-flash",
        "pageId": page_id,
        "tokens_input": tokens_in,
        "tokens_output": tokens_out,
        "cost_usd": cost
    })
    save_json(CREDIT_LOG, logs)

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

def fetch_page_insights(fb_page_id, fb_token):
    """ดึงข้อมูล insights จาก Facebook สำหรับเพจหนึ่ง"""
    insights = {}
    
    # Page followers + fans
    try:
        url = f"https://graph.facebook.com/v21.0/{fb_page_id}?fields=followers_count,fan_count,name&access_token={fb_token}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            insights["page_name"] = data.get("name", "N/A")
            insights["followers"] = data.get("followers_count", 0)
            insights["fans"] = data.get("fan_count", 0)
    except Exception as e:
        print(f"Error fetching page info: {e}")

    # Recent posts performance
    try:
        url = f"https://graph.facebook.com/v21.0/{fb_page_id}/posts?fields=id,message,created_time,shares,likes.limit(0).summary(true),comments.limit(0).summary(true)&limit=10&access_token={fb_token}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            posts = data.get("data", [])
            
            total_likes = 0
            total_comments = 0
            total_shares = 0
            top_post = None
            top_likes = 0
            
            for post in posts:
                likes = post.get("likes", {}).get("summary", {}).get("total_count", 0)
                comments = post.get("comments", {}).get("summary", {}).get("total_count", 0)
                shares = post.get("shares", {}).get("count", 0)
                
                total_likes += likes
                total_comments += comments
                total_shares += shares
                
                if likes > top_likes:
                    top_likes = likes
                    top_post = {
                        "id": post.get("id"),
                        "message": (post.get("message") or "")[:100],
                        "likes": likes,
                        "comments": comments,
                        "shares": shares
                    }
            
            insights["recent_posts_count"] = len(posts)
            insights["total_likes"] = total_likes
            insights["total_comments"] = total_comments
            insights["total_shares"] = total_shares
            insights["top_post"] = top_post
    except Exception as e:
        print(f"Error fetching posts: {e}")

    return insights

def generate_summary(insights, page_name):
    """ให้ AI สรุปรายงานภาษาไทย"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    insights_text = json.dumps(insights, ensure_ascii=False, indent=2)
    
    payload = {
        "model": "google/gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": "คุณคือนักวิเคราะห์สถิติเพจ Facebook ชื่อ 'น้องฟ้า' หน้าที่คือสรุปรายงานประจำวันให้เจ้าของเพจ"},
            {"role": "user", "content": f"สรุปรายงานสถิติเพจ \"{page_name}\" วันนี้ (ภาษาไทย) จากข้อมูล:\n{insights_text}\n\nกรุณาสรุป 2 ส่วน:\n1. สรุปสถิติ (4-6 บรรทัด) - ผู้ติดตาม, ยอดรวม like/comment/share, โพสต์ที่ดีที่สุด\n2. แนะนำเวลาโพสต์ (Smart Scheduling) - วิเคราะห์จากเวลาที่คนมี engagement มากสุดว่าควรโพสต์ช่วงไหน"}
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
            return result, tokens_in, tokens_out, cost
    except Exception as e:
        print(f"Error generating summary: {e}")
    
    return None, 0, 0, 0

def analyze_single_page(page_info):
    """วิเคราะห์เพจเดียว"""
    page_id = page_info["id"]
    page_name = page_info["name"]
    fb_page_id = page_info["pageId"]
    fb_token = page_info["accessToken"]
    
    print(f"\n  📊 กำลังวิเคราะห์เพจ: {page_name} (ID: {fb_page_id})")
    
    insights = fetch_page_insights(fb_page_id, fb_token)
    print(f"  ข้อมูลเพจ: {insights.get('page_name', 'N/A')} | Followers: {insights.get('followers', 0)}")
    
    result, tokens_in, tokens_out, cost = generate_summary(insights, page_name)
    
    summary = "ไม่สามารถสร้างรายงานได้ กรุณาตรวจสอบ API"
    if result and "choices" in result and len(result["choices"]) > 0:
        summary = result["choices"][0]["message"]["content"].strip()
    
    log_credit(f"รายงานสถิติประจำวัน ({page_name})", tokens_in, tokens_out, cost, page_id)
    print(f"  ✅ สรุปเสร็จ: {summary[:80]}...")
    
    return {
        "pageId": page_id,
        "pageName": page_name,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "timestamp": datetime.now().isoformat(),
        "insights": insights,
        "summary": summary
    }

def main():
    print(f"=== 🦊 น้องฟ้า เริ่มวิเคราะห์ ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ===")
    
    pages = get_all_pages()
    if not pages:
        print("ไม่พบเพจที่ตั้งค่าไว้ กรุณาเพิ่มเพจในหน้า Settings")
        return
    
    print(f"พบ {len(pages)} เพจที่ต้องวิเคราะห์")
    
    today_reports = []
    
    for page_info in pages:
        try:
            report = analyze_single_page(page_info)
            today_reports.append(report)
            
            # เซฟรายงานล่าสุดแยกรายเพจ
            per_page_report = BASE_DIR / f"daily_report_{page_info['id']}.json"
            save_json(per_page_report, report)
        except Exception as e:
            print(f"  ❌ Error วิเคราะห์เพจ {page_info['name']}: {e}")
    
    # เซฟรายงานรวมล่าสุด (ทุกเพจ)
    combined_report = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "timestamp": datetime.now().isoformat(),
        "pages": today_reports
    }
    save_json(BASE_DIR / "daily_report.json", combined_report)
    
    # เก็บประวัติรายงานย้อนหลัง 30 วัน
    reports_file = BASE_DIR / "daily_reports.json"
    all_reports = load_json(reports_file, [])
    all_reports.append(combined_report)
    all_reports = all_reports[-30:]
    save_json(reports_file, all_reports)
    
    print(f"\n=== 🦊 น้องฟ้า เสร็จสิ้น (วิเคราะห์ {len(today_reports)} เพจ) ===\n")

if __name__ == "__main__":
    main()
