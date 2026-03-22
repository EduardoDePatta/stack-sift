import type { IncidentCategory, IncidentInsight } from "~/shared/types/incident"
import { SidebarSection } from "../SidebarSection"
import { ConfidenceBar } from "./ConfidenceBar"
import { ExportFeedbackButton } from "./ExportFeedbackButton"
import { FeedbackPanel } from "./FeedbackPanel"
import { FrameLabel } from "./FrameLabel"
import { OpenInEditorButton } from "./OpenInEditorButton"
import { RetrainButton } from "./RetrainButton"
import { PRIORITY_COLORS } from "./constants"

export interface SidebarProps {
  insight: IncidentInsight
  onFeedback?: (category: IncidentCategory) => void | Promise<void>
  feedbackSaved?: boolean
  existingFeedbackCategory?: IncidentCategory | null
}

export function Sidebar({
  insight,
  onFeedback,
  feedbackSaved,
  existingFeedbackCategory
}: SidebarProps) {
  const {
    classification,
    summary,
    hypothesis,
    recommendations,
    priority,
    firstUsefulFrame,
    usefulFrames
  } = insight
  const priorityColor = PRIORITY_COLORS[priority] ?? "#6b7280"

  const otherFrames = usefulFrames.filter((f) => f !== firstUsefulFrame)

  return (
    <div className="ss-sidebar">
      <div className="ss-header">
        <span className="ss-logo">Stack Sift</span>
      </div>

      <SidebarSection title="Category">
        <span className="ss-badge">{classification.category}</span>
      </SidebarSection>

      <SidebarSection title="Confidence">
        <ConfidenceBar value={classification.confidence} />
      </SidebarSection>

      <SidebarSection title="Priority">
        <span className="ss-priority" style={{ color: priorityColor }}>
          {priority.toUpperCase()}
        </span>
      </SidebarSection>

      <SidebarSection title="Summary">
        <p className="ss-text">{summary}</p>
      </SidebarSection>

      {recommendations && recommendations.length > 0 ? (
        <SidebarSection title="Recommendations">
          <ul className="ss-recommendations">
            {recommendations.map((rec, i) => (
              <li key={i} className="ss-recommendation-item">
                {rec.text}
              </li>
            ))}
          </ul>
        </SidebarSection>
      ) : (
        <SidebarSection title="Hypothesis">
          <p className="ss-text">{hypothesis}</p>
        </SidebarSection>
      )}

      {firstUsefulFrame && (
        <SidebarSection title="Origin Frame">
          <FrameLabel frame={firstUsefulFrame} />
          <OpenInEditorButton frame={firstUsefulFrame} />
        </SidebarSection>
      )}

      {otherFrames.length > 0 && (
        <SidebarSection title="Stack Frames">
          <div className="ss-frame-list">
            {otherFrames.map((frame, i) => (
              <div key={i} className="ss-frame-item">
                <FrameLabel frame={frame} />
                <OpenInEditorButton frame={frame} />
              </div>
            ))}
          </div>
        </SidebarSection>
      )}

      {classification.signals.length > 0 && (
        <SidebarSection title="Signals">
          <div className="ss-signals">
            {classification.signals.map((signal) => (
              <span key={signal} className="ss-signal-tag">
                {signal}
              </span>
            ))}
          </div>
        </SidebarSection>
      )}

      {onFeedback && (
        <SidebarSection title="Feedback">
          <FeedbackPanel
            currentCategory={classification.category}
            onFeedback={onFeedback}
            feedbackSaved={feedbackSaved ?? false}
            existingCategory={existingFeedbackCategory ?? null}
          />
          <RetrainButton />
          <ExportFeedbackButton />
        </SidebarSection>
      )}
    </div>
  )
}
