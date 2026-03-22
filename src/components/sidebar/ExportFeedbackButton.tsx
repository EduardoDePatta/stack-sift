import { useCallback, useEffect, useState } from "react"
import { exportFeedbackAsTrainingJSON, getFeedbackCount } from "~/features/feedback/storage"

export function ExportFeedbackButton() {
  const [count, setCount] = useState(0)
  const [status, setStatus] = useState<"idle" | "done">("idle")

  useEffect(() => {
    getFeedbackCount().then(setCount).catch(() => setCount(0))
  }, [])

  const handleExport = useCallback(async () => {
    const json = await exportFeedbackAsTrainingJSON()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stack-sift-feedback-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus("done")
    setTimeout(() => setStatus("idle"), 2000)
  }, [])

  if (count === 0) return null

  return (
    <div className="ss-export-feedback">
      {status === "done" ? (
        <span className="ss-export-done">Exportado!</span>
      ) : (
        <button className="ss-export-btn" onClick={handleExport}>
          Exportar {count} feedback{count > 1 ? "s" : ""} (JSON)
        </button>
      )}
    </div>
  )
}
