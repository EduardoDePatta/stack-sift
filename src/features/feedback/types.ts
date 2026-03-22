import type { IncidentCategory } from "~/shared/types/incident"
import type { MLFeatures } from "~/features/ml/types"

export interface FeedbackExample {
  id: string
  fingerprint: string
  features: MLFeatures
  category: IncidentCategory
  timestamp: number
}

export interface FeedbackStore {
  examples: FeedbackExample[]
}
