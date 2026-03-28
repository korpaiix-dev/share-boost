const CAPTION_STYLES = [
  { id: 'direct_sell', label: 'ขายตรง🔥', description: 'กระตุ้นให้ซื้อ มี CTA ชัดเจน บอกราคา/โปรโมชัน สร้าง urgency' },
  { id: 'educate', label: 'ให้ความรู้📖', description: 'แชร์ tips/ความรู้ก่อน แล้วแนะนำสินค้า/บริการแบบ soft sell ท้ายโพสต์' },
  { id: 'funny', label: 'ตลก😂', description: 'ภาษาสนุก ล้อเลียน มีอารมณ์ขัน แทรกสินค้าแบบเนียน' },
  { id: 'story', label: 'เล่าเรื่อง💬', description: 'เริ่มจากประสบการณ์จริง ปัญหาที่เจอ แล้วนำเข้าสู่สินค้า/บริการเป็นทางออก' },
  { id: 'question', label: 'ถามนำ❓', description: 'ตั้งคำถาม hook ชวนคิด แล้วคำตอบคือสินค้า/บริการของเรา' },
  { id: 'announce', label: 'ประกาศ📢', description: 'ตรงๆ กระชับ เป็นทางการ เหมาะสำหรับข่าวสาร/event/เปิดตัว' }
];

const INTENSITY_LEVELS = [
  { id: 'light', label: 'เบา' },
  { id: 'medium', label: 'กลาง' },
  { id: 'heavy', label: 'แรง' }
];

const LENGTH_LEVELS = [
  { id: 'short', label: 'สั้น' },
  { id: 'medium', label: 'กลาง' },
  { id: 'long', label: 'ยาว' }
];

const EMOJI_LEVELS = [
  { id: 'none', label: 'ไม่มี' },
  { id: 'low', label: 'น้อย' },
  { id: 'medium', label: 'ปานกลาง' },
  { id: 'high', label: 'เยอะ' }
];

const SPEED_PRESETS = [
  { id: 'fast', label: 'เร็ว', min: 30, max: 120 },
  { id: 'normal', label: 'ปกติ', min: 120, max: 300 },
  { id: 'slow', label: 'ช้า', min: 300, max: 600 }
];

const DEFAULT_SETTINGS = {
  delay_min: 120,
  delay_max: 300,
  max_shares_per_day: 20,
  ai_provider: 'none',
  ai_api_key: '',
  ai_model: 'deepseek-chat',
  language: 'th'
};

const AI_PROVIDERS = [
  { id: 'none', label: 'ไม่ใช้' },
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'openai', label: 'OpenAI' }
];

const GROUP_STATUS = {
  active: { label: 'ใช้ได้', emoji: '🟢' },
  warning: { label: 'ระวัง', emoji: '🟡' },
  banned: { label: 'โดนแบน', emoji: '🔴' }
};

module.exports = {
  CAPTION_STYLES,
  INTENSITY_LEVELS,
  LENGTH_LEVELS,
  EMOJI_LEVELS,
  SPEED_PRESETS,
  DEFAULT_SETTINGS,
  AI_PROVIDERS,
  GROUP_STATUS
};
