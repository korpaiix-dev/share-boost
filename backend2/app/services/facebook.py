"""
Facebook Graph API Service — ใช้ร่วมกันทั้ง routes และ workers
"""
import json
import mimetypes
import urllib.request
import urllib.error
from typing import Optional, List

from app.config import settings

FB_API = f"https://graph.facebook.com/{settings.FB_API_VERSION}"


def _multipart_upload(url: str, fields: dict, files: dict) -> Optional[dict]:
    """อัพโหลด multipart/form-data ไปยัง Facebook (ใช้ stdlib ไม่พึ่ง requests)"""
    boundary = "----PostPilotBoundary7MA4YWxkTrZu0gW"
    body = bytearray()

    for key, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode())
        body.extend(f"{value}\r\n".encode())

    for key, (filename, content) in files.items():
        mimetype = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'.encode())
        body.extend(f"Content-Type: {mimetype}\r\n\r\n".encode())
        body.extend(content)
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode())

    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
    }
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"FB API Error ({e.code}): {e.read().decode()}")
        return None


def post_photo(fb_page_id: str, access_token: str, caption: str, photo_bytes: bytes, filename: str) -> Optional[str]:
    """โพสต์รูปภาพเดี่ยว — return post_id หรือ None"""
    url = f"{FB_API}/{fb_page_id}/photos"
    fields = {"access_token": access_token, "caption": caption}
    files = {"source": (filename, photo_bytes)}
    result = _multipart_upload(url, fields, files)
    if result and ("id" in result or "post_id" in result):
        return result.get("id") or result.get("post_id")
    return None


def post_video(fb_page_id: str, access_token: str, caption: str, video_bytes: bytes, filename: str) -> Optional[str]:
    """โพสต์วิดีโอ — return post_id หรือ None"""
    url = f"{FB_API}/{fb_page_id}/videos"
    fields = {"access_token": access_token, "description": caption}
    files = {"source": (filename, video_bytes)}
    result = _multipart_upload(url, fields, files)
    if result and ("id" in result or "post_id" in result):
        return result.get("id") or result.get("post_id")
    return None


def post_album(fb_page_id: str, access_token: str, caption: str, photos: List[tuple]) -> Optional[str]:
    """โพสต์อัลบั้มรูป — photos = [(filename, bytes), ...]"""
    uploaded_ids = []
    for filename, content in photos:
        url = f"{FB_API}/{fb_page_id}/photos"
        fields = {"access_token": access_token, "published": "false"}
        files = {"source": (filename, content)}
        result = _multipart_upload(url, fields, files)
        if result and "id" in result:
            uploaded_ids.append(result["id"])

    if not uploaded_ids:
        return None

    # สร้างโพสต์อัลบั้ม
    feed_url = f"{FB_API}/{fb_page_id}/feed"
    fields = {"access_token": access_token, "message": caption}
    for idx, media_id in enumerate(uploaded_ids):
        fields[f"attached_media[{idx}]"] = json.dumps({"media_fbid": media_id})
    result = _multipart_upload(feed_url, fields, {})
    if result and "id" in result:
        return result["id"]
    return None


def post_text(fb_page_id: str, access_token: str, message: str) -> Optional[str]:
    """โพสต์ข้อความล้วนๆ"""
    url = f"{FB_API}/{fb_page_id}/feed"
    data = json.dumps({"message": message, "access_token": access_token}).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return result.get("id")
    except urllib.error.HTTPError as e:
        print(f"FB API Error ({e.code}): {e.read().decode()}")
        return None


def fetch_page_posts(fb_page_id: str, access_token: str, limit: int = 20) -> list:
    """ดึงโพสต์ล่าสุดจากเพจ"""
    url = (
        f"{FB_API}/{fb_page_id}/posts"
        f"?fields=id,message,created_time,shares,likes.limit(0).summary(true),comments.limit(0).summary(true)"
        f"&limit={limit}&access_token={access_token}"
    )
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode()).get("data", [])
    except Exception as e:
        print(f"Error fetching posts: {e}")
        return []


def fetch_comments(post_id: str, access_token: str) -> list:
    """ดึงคอมเมนต์ของโพสต์"""
    url = (
        f"{FB_API}/{post_id}/comments"
        f"?fields=id,from,message,created_time&limit=50&access_token={access_token}"
    )
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode()).get("data", [])
    except Exception as e:
        print(f"Error fetching comments: {e}")
        return []


def reply_comment(comment_id: str, message: str, access_token: str) -> bool:
    """ตอบกลับคอมเมนต์"""
    url = f"{FB_API}/{comment_id}/comments"
    data = json.dumps({"message": message, "access_token": access_token}).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return result.get("id") is not None
    except urllib.error.HTTPError as e:
        print(f"Reply Error ({e.code}): {e.read().decode()}")
        return False


def fetch_page_info(fb_page_id: str, access_token: str) -> dict:
    """ดึงข้อมูลเพจ (ชื่อ, followers)"""
    url = f"{FB_API}/{fb_page_id}?fields=name,followers_count,fan_count&access_token={access_token}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching page info: {e}")
        return {}
