function ProgressBar({ current, total, label, successCount, failCount, message }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="progress-container">
      {label && <div className="text-sm mb-2" style={{ fontWeight: 600 }}>{label}</div>}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="progress-text">
        <span>{message || `${current} / ${total}`}</span>
        <span>{percentage}%</span>
      </div>
      {(successCount !== undefined || failCount !== undefined) && (
        <div className="flex gap-3 mt-2 text-xs">
          {successCount !== undefined && <span className="text-success">✅ สำเร็จ {successCount}</span>}
          {failCount !== undefined && <span className="text-danger">❌ ล้มเหลว {failCount}</span>}
        </div>
      )}
    </div>
  );
}
