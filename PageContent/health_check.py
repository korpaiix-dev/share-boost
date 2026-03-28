#!/usr/bin/env python3
"""
พี่ลีโอ (Agent Leo) - Health Monitor
ตรวจสอบว่า Agent ตัวอื่นๆ ทำงานปกติไหม
ไม่กินเครดิต AI - แค่อ่าน log files
รันทุก 1 ชม.
"""

import json
import os
from pathlib import Path
from datetime import datetime, timedelta

BASE_DIR = Path.home() / "PageContent"
HEALTH_FILE = BASE_DIR / "health_status.json"
CREDIT_LOG = BASE_DIR / "credit_log.json"
CRON_LOG = BASE_DIR / "cron.log"
REPLIED_FILE = BASE_DIR / "replied.json"
DAILY_REPORT = BASE_DIR / "daily_report.json"
QUEUE_FILE = BASE_DIR / "queue.json"
ENV_FILE = Path.home() / ".openclaw" / ".env"

def load_json(path, default):
    if path.exists():
        try:
            with open(path, "r") as f: return json.load(f)
        except: pass
    return default

def check_mint_status():
    """ตรวจน้องมิ้นท์ (Content Writer)"""
    status = {"name": "น้องมิ้นท์", "role": "Content Writer", "healthy": True, "issues": []}
    
    # Check if queue has content
    queue = load_json(QUEUE_FILE, {})
    if not queue.get("nextPost"):
        status["issues"].append("ไม่มีคิวโพสต์ถัดไป")
    
    # Check cron log for recent activity
    if CRON_LOG.exists():
        mtime = datetime.fromtimestamp(CRON_LOG.stat().st_mtime)
        if (datetime.now() - mtime) > timedelta(hours=26):
            status["issues"].append("Cron ไม่ได้รันมากกว่า 26 ชม.")
            status["healthy"] = False
    else:
        status["issues"].append("ไม่มีไฟล์ cron.log")
    
    if not status["issues"]:
        status["issues"] = ["ปกติ ✅"]
    
    return status

def check_pink_status():
    """ตรวจน้องพิ้งค์ (Responder)"""
    status = {"name": "น้องพิ้งค์", "role": "Responder", "healthy": True, "issues": []}
    
    replied = load_json(REPLIED_FILE, [])
    status["total_replied"] = len(replied)
    
    # Check credit log for pink's activity
    credits = load_json(CREDIT_LOG, [])
    pink_credits = [c for c in credits if c.get("agent") == "agent-pink"]
    
    if not pink_credits:
        status["issues"].append("ยังไม่เคยตอบคอมเมนต์")
    else:
        last = pink_credits[-1]
        last_time = datetime.fromisoformat(last["timestamp"])
        hours_ago = (datetime.now() - last_time).total_seconds() / 3600
        if hours_ago > 2:
            status["issues"].append(f"ตอบล่าสุดเมื่อ {hours_ago:.0f} ชม. ที่แล้ว")
    
    if not status["issues"]:
        status["issues"] = ["ปกติ ✅"]
    
    return status

def check_fah_status():
    """ตรวจน้องฟ้า (Analyst)"""
    status = {"name": "น้องฟ้า", "role": "Analyst", "healthy": True, "issues": []}
    
    report = load_json(DAILY_REPORT, {})
    if not report:
        status["issues"].append("ยังไม่มีรายงาน")
    else:
        report_date = report.get("date", "")
        today = datetime.now().strftime("%Y-%m-%d")
        if report_date != today:
            status["issues"].append(f"รายงานล่าสุดเมื่อ {report_date} (ไม่ใช่วันนี้)")
    
    if not status["issues"]:
        status["issues"] = ["ปกติ ✅"]
    
    return status

def check_credit_status():
    """ตรวจค่าใช้จ่ายเครดิต"""
    credits = load_json(CREDIT_LOG, [])
    
    today = datetime.now().strftime("%Y-%m-%d")
    today_credits = [c for c in credits if c.get("timestamp", "").startswith(today)]
    today_cost = sum(c.get("cost_usd", 0) for c in today_credits)
    total_cost = sum(c.get("cost_usd", 0) for c in credits)
    
    alerts = []
    if today_cost > 0.10:
        alerts.append(f"⚠️ วันนี้ใช้ไป ${today_cost:.4f} (มากกว่าปกติ)")
    
    return {
        "today_cost_usd": today_cost,
        "today_cost_thb": today_cost * 34,
        "total_cost_usd": total_cost,
        "total_cost_thb": total_cost * 34,
        "today_calls": len(today_credits),
        "alerts": alerts
    }

def main():
    print(f"=== 🦁 พี่ลีโอ ตรวจสุขภาพระบบ ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ===")
    
    health = {
        "timestamp": datetime.now().isoformat(),
        "agents": [
            check_mint_status(),
            check_pink_status(),
            check_fah_status()
        ],
        "credits": check_credit_status(),
        "overall": "healthy"
    }
    
    # Check if any agent is unhealthy
    for agent in health["agents"]:
        if not agent["healthy"]:
            health["overall"] = "warning"
            break
    
    if health["credits"]["alerts"]:
        health["overall"] = "warning"
    
    # Print summary
    for agent in health["agents"]:
        icon = "✅" if agent["healthy"] else "⚠️"
        print(f"  {icon} {agent['name']} ({agent['role']}): {', '.join(agent['issues'])}")
    
    print(f"  💰 วันนี้ใช้: ฿{health['credits']['today_cost_thb']:.2f} ({health['credits']['today_calls']} ครั้ง)")
    print(f"  📊 สถานะรวม: {health['overall']}")
    
    # Save health status
    with open(HEALTH_FILE, "w") as f:
        json.dump(health, f, ensure_ascii=False, indent=2)
    
    print(f"=== 🦁 พี่ลีโอ เสร็จสิ้น ===\n")

if __name__ == "__main__":
    main()
