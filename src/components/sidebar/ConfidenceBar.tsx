export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="ss-confidence-bar">
      <div className="ss-confidence-fill" style={{ width: `${pct}%` }} />
      <span className="ss-confidence-label">{pct}%</span>
    </div>
  )
}
