import type { IncidentCategory, IncidentInsight } from "~/shared/types/incident"
import type { MLFeatures } from "~/features/ml/types"

export interface AnalysisResult {
  insight: IncidentInsight
  features: MLFeatures
  existingFeedbackCategory: IncidentCategory | null
}
