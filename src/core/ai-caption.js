const { CAPTION_STYLES } = require('../shared/constants');

function buildPrompt({ topic, details, style, intensity, length, emojiLevel, previousCaptions }) {
  const styleObj = CAPTION_STYLES.find(s => s.id === style);
  const styleDesc = styleObj ? styleObj.description : '';

  const intensityMap = { light: 'เบาๆ นุ่มนวล', medium: 'ปานกลาง สมดุล', heavy: 'แรงจัด กระแทก' };
  const lengthMap = { short: 'สั้นกระชับ 2-3 บรรทัด', medium: 'ปานกลาง 4-6 บรรทัด', long: 'ยาวละเอียด 7-10 บรรทัด' };
  const emojiMap = { none: 'ไม่ใส่ emoji เลย', low: 'ใส่ emoji น้อยๆ 1-2 ตัว', medium: 'ใส่ emoji ปานกลาง 3-5 ตัว', high: 'ใส่ emoji เยอะๆ ทุกย่อหน้า' };

  let prompt = `คุณเป็นนักเขียน copywriting มืออาชีพ สร้าง caption สำหรับโพสต์ Facebook

หัวข้อ: ${topic || 'ทั่วไป'}
รายละเอียด: ${details || '-'}
สไตล์: ${styleDesc}
ความแรง: ${intensityMap[intensity] || intensityMap.medium}
ความยาว: ${lengthMap[length] || lengthMap.medium}
Emoji: ${emojiMap[emojiLevel] || emojiMap.medium}
ภาษา: ไทย`;

  if (previousCaptions && previousCaptions.length > 0) {
    prompt += `\n\nห้ามซ้ำกับ caption ก่อนหน้า:\n${previousCaptions.join('\n---\n')}`;
  }

  prompt += '\n\nสร้าง 1 caption เท่านั้น ไม่ต้องมีคำอธิบาย ตอบแค่ caption';
  return prompt;
}

async function generateCaption(settings, params) {
  const provider = settings.ai_provider;
  const apiKey = settings.ai_api_key;
  const model = settings.ai_model || 'deepseek-chat';

  if (!provider || provider === 'none') {
    throw new Error('ไม่ได้ตั้งค่า AI Provider');
  }
  if (!apiKey) {
    throw new Error('ไม่ได้ใส่ API Key');
  }

  const prompt = buildPrompt(params);

  let apiUrl, headers, body;

  switch (provider) {
    case 'openrouter':
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = { model, messages: [{ role: 'user', content: prompt }], max_tokens: 1000 };
      break;
    case 'deepseek':
      apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = { model, messages: [{ role: 'user', content: prompt }], max_tokens: 1000 };
      break;
    case 'openai':
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = { model, messages: [{ role: 'user', content: prompt }], max_tokens: 1000 };
      break;
    default:
      throw new Error(`ไม่รองรับ provider: ${provider}`);
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const caption = data.choices?.[0]?.message?.content?.trim();
  if (!caption) throw new Error('AI ไม่ส่ง caption กลับมา');
  return caption;
}

async function generateMultipleCaptions(settings, params, count = 3) {
  const captions = [];
  for (let i = 0; i < count; i++) {
    const caption = await generateCaption(settings, {
      ...params,
      previousCaptions: captions
    });
    captions.push(caption);
  }
  return captions;
}

async function testConnection(settings) {
  try {
    await generateCaption(settings, {
      topic: 'ทดสอบ',
      details: 'ทดสอบการเชื่อมต่อ',
      style: 'announce',
      intensity: 'light',
      length: 'short',
      emojiLevel: 'low'
    });
    return { success: true, message: 'เชื่อมต่อสำเร็จ!' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = { generateCaption, generateMultipleCaptions, testConnection, buildPrompt };
