import { useCallback, useEffect, useRef, useState } from "react"

import { Sidebar } from "~/components/sidebar/Sidebar"
import { saveFeedback } from "~/features/feedback/storage"
import type { MLFeatures } from "~/features/ml/types"
import { analyzeCurrentPage } from "~/features/sentry"
import type { IncidentCategory, IncidentInsight } from "~/shared/types/incident"

export function SentrySidebarApp() {
  const [insight, setInsight] = useState<IncidentInsight | null>(null)
  const [isOpen, setIsOpen] = useState(true)
  const [feedbackSaved, setFeedbackSaved] = useState(false)
  const [existingCategory, setExistingCategory] =
    useState<IncidentCategory | null>(null)
  const featuresRef = useRef<MLFeatures | null>(null)

  const analyze = useCallback(async () => {
    const result = await analyzeCurrentPage(document)
    if (result) {
      setInsight(result.insight)
      featuresRef.current = result.features
      setExistingCategory(result.existingFeedbackCategory)
    } else {
      setInsight(null)
      featuresRef.current = null
      setExistingCategory(null)
    }
    setFeedbackSaved(false)
  }, [])

  useEffect(() => {
    analyze()

    const observer = new MutationObserver(() => {
      analyze()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [analyze])

  const handleFeedback = useCallback(
    async (category: IncidentCategory) => {
      if (!featuresRef.current) return
      await saveFeedback(featuresRef.current, category)
      setFeedbackSaved(true)
      setExistingCategory(category)
      setTimeout(() => analyze(), 100)
    },
    [analyze]
  )

  if (!insight) return null

  return (
    <div className={isOpen ? "" : "ss-collapsed"}>
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 999999
        }}>
        {isOpen ? (
          <div>
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                zIndex: 1000000
              }}>
              <button
                className="ss-toggle-btn"
                onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
            <Sidebar
              insight={insight}
              onFeedback={handleFeedback}
              feedbackSaved={feedbackSaved}
              existingFeedbackCategory={existingCategory}
            />
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            <button
              className="ss-toggle-btn"
              onClick={() => setIsOpen(true)}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e2e8",
                borderRadius: 6,
                boxShadow: "-2px 0 12px rgba(0,0,0,0.08)",
                padding: "8px 12px",
                fontWeight: 700,
                fontSize: 12
              }}>
              Stack Sift
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
