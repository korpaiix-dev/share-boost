import os
import sys
import json
import random
import urllib.request
import urllib.error
import mimetypes
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

# === Parse --page argument ===
PAGE_ID = 'main'
QUEUE_ONLY = False
for i, arg in enumerate(sys.argv):
    if arg == '--page' and i + 1 < len(sys.argv):
        PAGE_ID = sys.argv[i + 1]
    if arg == '--queue-only':
        QUEUE_ONLY = True

# Setup paths
BASE_DIR = Path.home() / "PageContent"
CONFIG_FILE = BASE_DIR / "dashboard_config.json"
CREDIT_LOG = BASE_DIR / "credit_log.json"
ENV_FILE = Path.home() / ".openclaw" / ".env"
AUTH_FILE = Path.home() / ".openclaw" / "agents" / "main" / "agent" / "auth-profiles.json"
PROMPT_FILE = Path.home() / ".openclaw" / "facebook_system_prompt.txt"

def load_env(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v

load_env(ENV_FILE)

# Load page-specific config from dashboard_config.json
def load_page_config(page_id):
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
            for p in config.get('pages', []):
                if p.get('id') == page_id:
                    return p
        except: pass
    return None

page_config = load_page_config(PAGE_ID)

if page_config:
    FB_PAGE_ID = page_config['pageId']
    FB_ACCESS_TOKEN = page_config['accessToken']
    PAGE_DIR = BASE_DIR / 'pages' / PAGE_ID
else:
    FB_PAGE_ID = os.environ.get('FACEBOOK_PAGE_ID')
    FB_ACCESS_TOKEN = os.environ.get('FACEBOOK_ACCESS_TOKEN')
    PAGE_DIR = BASE_DIR / 'pages' / 'main'

# Page-specific folders (no legacy fallback)
PHOTOS_DIR = PAGE_DIR / 'photos'
VIDEOS_DIR = PAGE_DIR / 'videos'
POSTED_FILE = PAGE_DIR / 'posted.json'
QUEUE_FILE = PAGE_DIR / 'queue.json'

PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
if not POSTED_FILE.exists():
    with open(POSTED_FILE, 'w') as f:
        json.dump([], f)

# Load OpenRouter API Key
with open(AUTH_FILE, 'r') as f:
    auth_data = json.load(f)
OPENROUTER_API_KEY = auth_data.get('profiles', {}).get('openrouter:default', {}).get('key')

# Load System Prompt
try:
    with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
        SYSTEM_PROMPT = f.read()
except:
    SYSTEM_PROMPT = 'คุณคือแอดมินเพจ'

def get_unposted_media():
    with open(POSTED_FILE, "r") as f:
        posted = json.load(f)
    
    media_files = []
    VALID_EXTS = ['.jpg', '.jpeg', '.png', '.mp4', '.mov']
    
    for d in [PHOTOS_DIR, VIDEOS_DIR]:
        for child in d.iterdir():
            if child.is_file() and child.suffix.lower() in VALID_EXTS:
                if child.name not in posted:
                    media_files.append(child)
                    
    return media_files

CAPTION_STYLES = {
    "sexy": "เซ็กซี่ น่าดึงดูด ขี้เล่น เชิญชวน",
    "cute": "น่ารัก สดใส อ่อนหวาน ใสๆ",
    "funny": "ขำขัน มุกตลก เรียกเสียงหัวเราะ",
    "sell": "กระตุ้นยอดขาย CTA แรง ใช้คำโน้มน้าว",
    "classy": "หรูหรา ดูแพง พรีเมียม สวยสง่า",
}

def get_caption_style():
    if page_config:
        style_id = page_config.get("captionStyle", "sexy")
        return CAPTION_STYLES.get(style_id, CAPTION_STYLES["sexy"])
    return CAPTION_STYLES["sexy"]

def get_trending_hashtags():
    try:
        url = "https://trends.google.com/trending/rss?geo=TH"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            trends = []
            for item in root.findall('./channel/item'):
                title = item.find('title')
                if title is not None and title.text:
                    clean_title = str(title.text).replace(' ', '')
                    trends.append(f"#{clean_title}")
            
            # Shuffle so each post gets different trending hashtags
            import random
            random.shuffle(trends)
            return " ".join(trends[:4]) # Pick 4 randomly
    except Exception as e:
        print("Failed to fetch trends:", e)
        return ""

def generate_caption(media_path, album_files=None):
    if album_files:
        is_video = False
        file_type = "อัลบั้มรูปภาพ"
        filename_ref = album_files[0]
    else:
        is_video = media_path.suffix.lower() in ['.mp4', '.mov']
        file_type = "วิดีโอ" if is_video else "รูปภาพ"
        filename_ref = media_path.name
        
    style = get_caption_style()
    keywords = page_config.get('keywords', '') if page_config else ''
    auto_trending = page_config.get('autoTrending', True) if page_config else True
    
    prompt_extra = ""
    if keywords:
        prompt_extra += f"\n5. **สำคัญมาก: ต้องแต่งประโยคเชิญชวนให้คนทำตามวิถีทางนี้ '{keywords}' และวางไว้บรรทัดสุดท้ายของแคปชั่นเสมอ**"
        
    if auto_trending:
        trends = get_trending_hashtags()
        if trends:
            prompt_extra += f"\n6. กรุณาแทรกแฮชแท็กที่เป็นกระแสของวันนี้เข้าไปในแคปชั่นด้วย: {trends}"

    prompt_text = f"สร้างแคปชั่นเฟสบุ๊ค 1 โพสต์ สำหรับ{file_type}ในรูปภาพนี้ ความยาว 2-4 บรรทัด โทน: {style}\nข้อกำหนด:\n1. วิเคราะห์และเขียนให้สอดคล้องกับภาพที่แนบมานี้\n2. ให้มีแฮชแท็ก 3-4 ตัว\n3. ห้ามมีคำอธิบายหรือคำตอบรับใดๆ เด็ดขาด เอาเฉพาะสเตตัสที่จะโพสต์เพียวๆ\n4. ห้ามเอาชื่อไฟล์หรือตัวเลขมามั่วเป็นชื่อคน{prompt_extra}"

    # Encode image to base64 for vision API
    import base64
    base64_img = None
    try:
        if album_files:
            # For albums, use the first photo
            img_path = PHOTOS_DIR / album_files[0]
        elif not is_video:
            img_path = media_path
        else:
            img_path = None  # Videos don't have a simple image to encode

        if img_path and img_path.exists():
            with open(img_path, 'rb') as img_f:
                base64_img = base64.b64encode(img_f.read()).decode('utf-8')
    except Exception as e:
        print(f"Warning: Could not encode image to base64: {e}")
        base64_img = None

    # Setup OpenRouter API
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    user_content = [{"type": "text", "text": prompt_text}]
    if base64_img:
        user_content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_img}"}})
    else:
        user_content = prompt_text

    payload = {
        "model": "google/gemini-2.5-flash", 
        "messages": [
            {"role": "system", "content": f"คุณคือแอดมินเพจ โทนการเขียน: {style}"},
            {"role": "user", "content": user_content}
        ]
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            if "choices" in result and len(result["choices"]) > 0 and "message" in result["choices"][0]:
                caption_text = result["choices"][0]["message"]["content"].strip()
                # Log credit usage
                usage = result.get("usage", {})
                tokens_in = usage.get("prompt_tokens", 0)
                tokens_out = usage.get("completion_tokens", 0)
                cost = tokens_in * 0.15 / 1_000_000 + tokens_out * 0.6 / 1_000_000
                log_credit(
                    action=f"แต่งแคปชั่น: {filename_ref}",
                    model="gemini-2.5-flash",
                    tokens_input=tokens_in,
                    tokens_output=tokens_out,
                    cost_usd=cost
                )
                return caption_text
            
    except Exception as e:
        print("Error generating caption:", e)
    
    return "ทักทายจ้า ใครเหงาๆ อย่าลืมกดเข้ามาดูโปรไฟล์เพื่อเข้ากลุ่มลับกันน้า 💕 #แจกวาร์ป #งานดี"

def post_facebook_multipart(url, fields, files):
    # simple multipart form-data encoded for python standard library
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = bytearray()
    
    for key, value in fields.items():
        body.extend(f'--{boundary}\r\n'.encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode('utf-8'))
        body.extend(f'{value}\r\n'.encode('utf-8'))
        
    for key, (filename, content) in files.items():
        mimetype = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        body.extend(f'--{boundary}\r\n'.encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'.encode('utf-8'))
        body.extend(f'Content-Type: {mimetype}\r\n\r\n'.encode('utf-8'))
        body.extend(content)
        body.extend(b'\r\n')
        
    body.extend(f'--{boundary}--\r\n'.encode('utf-8'))
    
    headers = {
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'Content-Length': str(len(body))
    }
    
    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error ({e.code}): {e.read().decode('utf-8')}")
        return None

def post_to_facebook(media_path, caption):
    is_video = media_path.suffix.lower() in [".mp4", ".mov"]
    
    url = f"https://graph.facebook.com/v21.0/{FB_PAGE_ID}/{'videos' if is_video else 'photos'}"
    
    fields = {
        'access_token': FB_ACCESS_TOKEN,
    }
    if is_video:
        fields['description'] = caption
    else:
        fields['caption'] = caption
        
    with open(media_path, 'rb') as f:
        file_content = f.read()
        
    files = {'source': (media_path.name, file_content)}
    
    print(f"Uploading {media_path.name} to Facebook...")
    result = post_facebook_multipart(url, fields, files)
    
    if result and ('id' in result or 'post_id' in result):
        post_id = result.get('id', result.get('post_id'))
        print(f"Successfully posted! ID: {post_id}")
        # Save Post ID for น้องพิ้งค์ (comment responder)
        save_post_id(post_id, media_path.name)
        return True
    return False

def post_album_to_facebook(album_files, caption):
    uploaded_ids = []
    
    # 1. Upload unpublished photos
    for filename in album_files:
        filepath = PHOTOS_DIR / filename
        if not filepath.exists():
            continue
            
        url = f"https://graph.facebook.com/v21.0/{FB_PAGE_ID}/photos"
        fields = {
            'access_token': FB_ACCESS_TOKEN,
            'published': 'false'
        }
        with open(filepath, 'rb') as f:
            file_content = f.read()
        files = {'source': (filepath.name, file_content)}
        
        print(f"Uploading unpublished photo: {filename}...")
        result = post_facebook_multipart(url, fields, files)
        if result and 'id' in result:
            uploaded_ids.append(result['id'])
            
    if not uploaded_ids:
        return False
        
    # 2. Attach media to feed post
    feed_url = f"https://graph.facebook.com/v21.0/{FB_PAGE_ID}/feed"
    
    fields = {
        'access_token': FB_ACCESS_TOKEN,
        'message': caption
    }
    for idx, media_id in enumerate(uploaded_ids):
        fields[f'attached_media[{idx}]'] = json.dumps({"media_fbid": media_id})
        
    print(f"Publishing album with {len(uploaded_ids)} photos...")
    result = post_facebook_multipart(feed_url, fields, {})
    
    if result and 'id' in result:
        post_id = result.get('id')
        print(f"Successfully posted album! ID: {post_id}")
        save_post_id(post_id, album_files[0]) # Save the first filename as reference
        return True
    return False

def save_post_id(post_id, filename):
    """บันทึก Post ID เพื่อให้น้องพิ้งค์รู้ว่าโพสต์ไหนเป็นของทีม"""
    post_ids_file = BASE_DIR / "post_ids.json"
    try:
        if post_ids_file.exists():
            with open(post_ids_file, "r") as f:
                ids = json.load(f)
        else:
            ids = []
        if post_id not in ids:
            ids.append(post_id)
        with open(post_ids_file, "w") as f:
            json.dump(ids, f, indent=2)
        print(f"Saved Post ID {post_id} for comment tracking")
    except Exception as e:
        print(f"Warning: Could not save post ID: {e}")

def post_text_only(caption):
    url = f"https://graph.facebook.com/v21.0/{FB_PAGE_ID}/feed"
    data = json.dumps({"message": caption, "access_token": FB_ACCESS_TOKEN}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f"Successfully posted text update! ID: {result.get('id', 'Unknown')}")
            return True
    except urllib.error.HTTPError as e:
        print(f"Error ({e.code}): {e.read().decode('utf-8')}")
        return False

def mark_as_posted(filename):
    with open(POSTED_FILE, "r") as f:
        posted = json.load(f)
    if filename not in posted:
        posted.append(filename)
        with open(POSTED_FILE, "w") as f:
            json.dump(posted, f, indent=4)

def get_queue():
    if QUEUE_FILE.exists():
        try:
            with open(QUEUE_FILE, "r") as f: return json.load(f)
        except: pass
    return {"nextPost": None}

def save_queue(queue_data):
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue_data, f, ensure_ascii=False, indent=2)

def log_credit(action, model, tokens_input, tokens_output, cost_usd):
    """บันทึกค่าใช้จ่าย AI ลง credit_log.json พร้อม pageId"""
    try:
        logs = []
        if CREDIT_LOG.exists():
            with open(CREDIT_LOG, 'r') as f:
                logs = json.load(f)
        logs.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent": "agent-mint",
            "action": action,
            "model": model,
            "pageId": PAGE_ID,
            "tokens_input": tokens_input,
            "tokens_output": tokens_output,
            "cost_usd": cost_usd
        })
        with open(CREDIT_LOG, 'w') as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Warning: Could not log credit: {e}")

def main():
    mode_label = "Queue-Only" if QUEUE_ONLY else "Auto-Post"
    print(f"--- Starting Facebook {mode_label} [Page: {PAGE_ID}] ---")
    queue = get_queue()
    
    # 1. Post Current Queue (skip if --queue-only)
    if not QUEUE_ONLY and queue.get("nextPost"):
        post_data = queue["nextPost"]
        media_path = Path(post_data["file_path"])
        caption = post_data["caption"]
        
        target_type = post_data.get("type", "single")
        
        if target_type == "album":
            album_files = post_data.get("albumFiles", [])
            print(f"Posting queued album: {len(album_files)} photos")
            success = post_album_to_facebook(album_files, caption)
            if success:
                for f in album_files: mark_as_posted(f)
        else:
            if media_path.exists():
                print(f"Posting queued media: {media_path.name}")
                success = post_to_facebook(media_path, caption)
                if success:
                    mark_as_posted(media_path.name)
            else:
                print(f"Queued media file not found: {media_path}")
                print("Attempting to find the file in page media folders...")
                # Try to find the file by name in the page's media folders
                found = None
                for search_dir in [PHOTOS_DIR, VIDEOS_DIR]:
                    candidate = search_dir / media_path.name
                    if candidate.exists():
                        found = candidate
                        break
                if found:
                    print(f"Found file at: {found}")
                    success = post_to_facebook(found, caption)
                    if success:
                        mark_as_posted(found.name)
                else:
                    print("File truly not found anywhere. Clearing stale queue and regenerating.")
            
    # 2. Prepare NEXT Post
    print("--- Generating NEXT post in advance ---")
    unposted = get_unposted_media()
    
    # If exhausted all files, clear the set and scan again
    if not unposted:
        print("All media exhausted! Clearing history to loop again...")
        with open(POSTED_FILE, "w") as f:
            json.dump([], f)
        unposted = get_unposted_media()
        if not unposted:
            print("No media files found at all. Cannot queue.")
            save_queue({"nextPost": None})
            return

    next_media = random.choice(unposted)
    print(f"Pre-selecting media for next time: {next_media.name}")
    
    # Check if this media belongs to any saved album
    TARGET_ALBUM = None
    ALBUMS_FILE = BASE_DIR / "albums.json"
    if ALBUMS_FILE.exists():
        try:
            with open(ALBUMS_FILE, "r") as f:
                saved_albums = json.load(f)
            for album in saved_albums:
                if next_media.name in album.get('files', []):
                    TARGET_ALBUM = album
                    print(f"File is part of album '{album.get('name')}'. Converting to Album post!")
                    break
        except Exception as e:
            print(f"Error reading albums: {e}")

    next_caption = generate_caption(next_media)
    
    if TARGET_ALBUM and next_caption:
        queue["nextPost"] = {
            "type": "album",
            "filename": TARGET_ALBUM["files"][0],
            "file_path": str(next_media), # reference
            "albumFiles": TARGET_ALBUM["files"],
            "caption": next_caption
        }
        save_queue(queue)
        print(f"Next album '{TARGET_ALBUM.get('name')}' successfully queued!")
    elif next_caption:
        queue["nextPost"] = {
            "type": "photo" if next_media.suffix.lower() in [".jpg", ".jpeg", ".png"] else "video",
            "file_path": str(next_media),
            "filename": next_media.name,
            "caption": next_caption
        }
        save_queue(queue)
        print("Next post successfully queued!")
    else:
        print("Failed to generate caption for next post.")

if __name__ == "__main__":
    main()
