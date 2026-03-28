const { useState } = React;

const CAPTION_STYLES = [
  { id: 'direct_sell', label: 'ขายตรง🔥' },
  { id: 'educate', label: 'ให้ความรู้📖' },
  { id: 'funny', label: 'ตลก😂' },
  { id: 'story', label: 'เล่าเรื่อง💬' },
  { id: 'question', label: 'ถามนำ❓' },
  { id: 'announce', label: 'ประกาศ📢' }
];

function CaptionAI({ api, onCaptionSelect, showToast }) {
  const [enabled, setEnabled] = useState(false);
  const [style, setStyle] = useState('direct_sell');
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [length, setLength] = useState('medium');
  const [emojiLevel, setEmojiLevel] = useState('medium');
  const [uniquePerGroup, setUniquePerGroup] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [selectedCaption, setSelectedCaption] = useState(null);

  // Non-AI caption
  const [manualCaption, setManualCaption] = useState('');

  async function handleGenerate() {
    if (!topic.trim()) {
      showToast('กรุณาใส่หัวข้อ', 'error');
      return;
    }
    setGenerating(true);
    setCaptions([]);
    setSelectedCaption(null);
    try {
      const results = await api.generateCaptions({
        topic, details, style, intensity, length, emojiLevel
      });
      setCaptions(results);
    } catch (err) {
      showToast(`สร้าง caption ไม่สำเร็จ: ${err.message || err}`, 'error');
    }
    setGenerating(false);
  }

  function handleSelect(index) {
    setSelectedCaption(index);
    if (onCaptionSelect) {
      onCaptionSelect({
        caption: captions[index],
        useAi: true,
        style,
        uniquePerGroup,
        params: { topic, details, style, intensity, length, emojiLevel }
      });
    }
  }

  function handleManualChange(value) {
    setManualCaption(value);
    if (onCaptionSelect) {
      onCaptionSelect({ caption: value, useAi: false });
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className="card-title" style={{ marginBottom: 0 }}>💬 Caption</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">AI Caption</span>
          <div className={`toggle ${enabled ? 'active' : ''}`} onClick={() => setEnabled(!enabled)}>
            <div className="toggle-knob" />
          </div>
        </div>
      </div>

      {!enabled ? (
        <div>
          <div className="form-group">
            <label className="form-label">Caption (รองรับ Spintax: {'{'}คำ1|คำ2|คำ3{'}'})</label>
            <textarea
              className="form-textarea"
              rows="4"
              placeholder="พิมพ์ caption ที่ต้องการ... ใช้ {คำ1|คำ2} เพื่อสุ่มคำ"
              value={manualCaption}
              onChange={e => handleManualChange(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="form-group">
            <label className="form-label">สไตล์</label>
            <div className="style-grid">
              {CAPTION_STYLES.map(s => (
                <div
                  key={s.id}
                  className={`style-btn ${style === s.id ? 'selected' : ''}`}
                  onClick={() => setStyle(s.id)}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">หัวข้อ</label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น ครีมหน้าขาว, คอร์สออนไลน์..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">รายละเอียด</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับสินค้า/บริการ..."
              value={details}
              onChange={e => setDetails(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ความแรง</label>
              <div className="level-group">
                {[{ id: 'light', label: 'เบา' }, { id: 'medium', label: 'กลาง' }, { id: 'heavy', label: 'แรง' }].map(l => (
                  <div key={l.id} className={`level-btn ${intensity === l.id ? 'selected' : ''}`} onClick={() => setIntensity(l.id)}>
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">ความยาว</label>
              <div className="level-group">
                {[{ id: 'short', label: 'สั้น' }, { id: 'medium', label: 'กลาง' }, { id: 'long', label: 'ยาว' }].map(l => (
                  <div key={l.id} className={`level-btn ${length === l.id ? 'selected' : ''}`} onClick={() => setLength(l.id)}>
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Emoji</label>
            <div className="level-group">
              {[{ id: 'none', label: 'ไม่มี' }, { id: 'low', label: 'น้อย' }, { id: 'medium', label: 'ปานกลาง' }, { id: 'high', label: 'เยอะ' }].map(l => (
                <div key={l.id} className={`level-btn ${emojiLevel === l.id ? 'selected' : ''}`} onClick={() => setEmojiLevel(l.id)}>
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div
              className={`checkbox ${uniquePerGroup ? 'checked' : ''}`}
              onClick={() => setUniquePerGroup(!uniquePerGroup)}
            />
            <span className="text-sm">สร้าง caption ไม่ซ้ำทุกกลุ่ม</span>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '⏳ กำลังสร้าง...' : '✨ สร้าง Caption'}
          </button>

          {captions.length > 0 && (
            <div className="mt-3">
              <label className="form-label">เลือก Caption ({captions.length} ตัวเลือก)</label>
              <div className="caption-options">
                {captions.map((cap, i) => (
                  <div
                    key={i}
                    className={`caption-option ${selectedCaption === i ? 'selected' : ''}`}
                    onClick={() => handleSelect(i)}
                  >
                    {cap}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
