# ShareBoost - Product & License System Design

## 1. Tier System (แบ่งตามจำนวนแชร์)

| | Demo (ฟรี) | Basic | Pro |
|---|---|---|---|
| **ราคา** | ฟรี | 299-499 บาท/เดือน | 799-1,299 บาท/เดือน |
| **แชร์ต่อวัน** | 5 ครั้ง | 30 ครั้ง | ไม่จำกัด |
| **จำนวนบัญชี FB** | 1 | 2 | 5 |
| **จำนวนกลุ่ม** | 10 | 50 | ไม่จำกัด |
| **AI Caption** | ไม่มี | มี (10 ครั้ง/วัน) | มี (ไม่จำกัด) |
| **ค้นหา+เข้าร่วมกลุ่ม** | ไม่มี | มี | มี |
| **ตั้งเวลาแชร์** | ไม่มี | มี | มี |
| **รายงานละเอียด** | แค่วันนี้ | 7 วัน | 30 วัน + Export |
| **อายุ License** | 3 วัน | 30 วัน | 30 วัน / 1 ปี |

---

## 2. ระบบ License - Online + Offline Fallback

### Flow การทำงาน

```
เปิดแอป
  │
  ├─ มี Internet? ──► YES ──► เช็ค License กับ Server
  │                              │
  │                              ├─ Valid ──► บันทึก Cache + เปิดใช้งานตาม Tier
  │                              └─ Invalid ──► แจ้งหมดอายุ / ลด Tier เป็น Demo
  │
  └─ ไม่มี Internet ──► เช็ค Cache ในเครื่อง
                           │
                           ├─ Cache อายุ < 3 วัน ──► เปิดใช้งานตาม Tier
                           ├─ Cache อายุ 3-7 วัน ──► เปิดใช้ แต่แจ้งเตือนให้ต่อเน็ต
                           └─ Cache หมดอายุ / ไม่มี ──► Demo mode
```

### ทำไมแนะนำ Online + Offline

- **Online เป็นหลัก**: ป้องกัน crack ได้ดี, ยกเลิก key ได้ทันที, ติดตามการใช้งานได้
- **Offline fallback**: ลูกค้าใช้งานได้แม้เน็ตหลุดชั่วคราว ไม่เสียประสบการณ์
- **Cache 3 วัน**: สมดุลระหว่างความสะดวกและความปลอดภัย

---

## 3. โครงสร้าง License Key

### รูปแบบ Key
```
SB-BASIC-XXXX-XXXX-XXXX
SB-PRO-XXXX-XXXX-XXXX
```

### ข้อมูลที่ Server เก็บ

```
license_key     : "SB-PRO-A1B2-C3D4-E5F6"
tier            : "pro"
customer_name   : "ชื่อลูกค้า"
customer_email  : "email@example.com"
machine_id      : "xxxx"  (ผูกกับเครื่อง ป้องกันใช้หลายเครื่อง)
activated_at    : "2026-03-27"
expires_at      : "2026-04-27"
max_shares_day  : -1  (ไม่จำกัด)
max_accounts    : 5
max_groups      : -1
is_active       : true
```

---

## 4. API Endpoints (สำหรับ Server)

### POST /api/license/activate
ลูกค้าใส่ License Key ครั้งแรก

```json
Request:
{
  "license_key": "SB-PRO-A1B2-C3D4-E5F6",
  "machine_id": "hash-ของ-เครื่อง",
  "app_version": "1.5.0"
}

Response (สำเร็จ):
{
  "success": true,
  "tier": "pro",
  "expires_at": "2026-04-27",
  "limits": {
    "max_shares_day": -1,
    "max_accounts": 5,
    "max_groups": -1,
    "ai_caption": true,
    "schedule": true,
    "search_join": true,
    "report_days": 30
  }
}
```

### POST /api/license/verify
เช็คทุกครั้งที่เปิดแอป

```json
Request:
{
  "license_key": "SB-PRO-A1B2-C3D4-E5F6",
  "machine_id": "hash-ของ-เครื่อง",
  "daily_shares": 15,
  "app_version": "1.5.0"
}

Response:
{
  "valid": true,
  "tier": "pro",
  "expires_at": "2026-04-27",
  "remaining_days": 28,
  "limits": { ... },
  "message": ""
}
```

### POST /api/license/usage
ส่งข้อมูลการใช้งานกลับ server (ทุก 1 ชม.)

```json
{
  "license_key": "...",
  "shares_today": 25,
  "shares_success": 22,
  "shares_failed": 3
}
```

---

## 5. สิ่งที่ต้องแก้ไขในแอป (ฝั่ง Client)

### ไฟล์ที่ต้องเพิ่ม/แก้ไข

```
app/
├── src/
│   ├── core/
│   │   ├── license.js          ← ใหม่: ระบบเช็ค license
│   │   └── queue.js            ← แก้: เพิ่มเช็คโควต้าก่อนแชร์
│   ├── renderer/
│   │   ├── pages/
│   │   │   └── LicensePage.jsx ← ใหม่: หน้ากรอก license key
│   │   └── index.html          ← แก้: เพิ่มหน้า License + lock ฟีเจอร์
│   └── shared/
│       └── constants.js        ← แก้: เพิ่ม tier limits
├── preload.js                  ← แก้: เพิ่ม IPC สำหรับ license
└── main.js                     ← แก้: เพิ่ม license handlers
```

### 5.1 license.js - ตัวอย่างโครงสร้าง

```javascript
// ฟังก์ชันหลัก
async function activate(licenseKey)     // ใส่ key ครั้งแรก
async function verify()                  // เช็คทุกครั้งที่เปิดแอป
function getLimits()                     // ดึง limits ของ tier ปัจจุบัน
function canShare()                      // เช็คว่าแชร์ได้อีกไหม (โควต้าวันนี้)
function recordShare()                   // บันทึก +1 share
function getMachineId()                  // สร้าง ID เฉพาะเครื่อง
function getCachedLicense()              // อ่าน cache จากไฟล์
function saveLicenseCache(data)          // บันทึก cache
```

### 5.2 UI ที่ต้องเพิ่ม

**หน้า License (แสดงเมื่อยังไม่ได้ใส่ key หรือหมดอายุ):**
- ช่องกรอก License Key
- ปุ่ม "เปิดใช้งาน"
- แสดงสถานะ Tier ปัจจุบัน
- แสดงวันหมดอายุ
- แสดงโควต้าที่เหลือวันนี้

**แถบสถานะ (แสดงตลอด):**
- Tier badge: "Demo" / "Basic" / "Pro"
- โควต้า: "แชร์วันนี้ 5/30"
- วันเหลือ: "เหลือ 28 วัน"

**Lock ฟีเจอร์:**
- ปุ่ม/ฟีเจอร์ที่ใช้ไม่ได้จะ gray out + แสดง "อัปเกรดเป็น Basic/Pro"
- เมื่อแชร์ครบโควต้า แสดง popup "หมดโควต้าวันนี้ อัปเกรดเพื่อแชร์เพิ่ม"

---

## 6. ป้องกันการ Crack

| มาตรการ | รายละเอียด |
|---------|-----------|
| ผูกเครื่อง (Machine ID) | ใช้ hardware hash ป้องกันเอา key ไปใช้เครื่องอื่น |
| Cache เข้ารหัส | เก็บ license cache เป็นไฟล์เข้ารหัส ไม่ใช่ plain text |
| เช็คเวลา | ถ้า system clock ถอยหลัง > 24 ชม. → บังคับเช็ค online |
| Obfuscate โค้ด | ใช้ javascript-obfuscator ก่อน build |
| Server-side quota | Server นับจำนวนแชร์จริง ไม่เชื่อ client 100% |

---

## 7. ลำดับขั้นการพัฒนา (แนะนำ)

### Phase 1 - พื้นฐาน (1-2 วัน)
- [ ] สร้าง license.js (activate, verify, cache)
- [ ] สร้าง LicensePage.jsx
- [ ] เพิ่มการเช็คโควต้าใน queue.js
- [ ] ทดสอบ Demo mode (จำกัด 5 แชร์/วัน)

### Phase 2 - Server (2-3 วัน)
- [ ] สร้าง API endpoints บน server
- [ ] สร้าง database สำหรับเก็บ licenses
- [ ] สร้าง Admin panel สำหรับออก/จัดการ key
- [ ] เชื่อมแอปกับ server

### Phase 3 - Polish (1-2 วัน)
- [ ] เพิ่ม UI lock ฟีเจอร์ตาม tier
- [ ] เพิ่มแถบสถานะ license
- [ ] เพิ่ม popup แจ้งเตือนหมดโควต้า/หมดอายุ
- [ ] Obfuscate โค้ดก่อน build

### Phase 4 - จัดการลูกค้า (เพิ่มเติม)
- [ ] Admin panel: ออก key, ดู usage, ยกเลิก key
- [ ] ระบบต่ออายุอัตโนมัติ
- [ ] ระบบแจ้งเตือนก่อนหมดอายุ 3 วัน
