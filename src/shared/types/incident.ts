export type IncidentCategory =
  | "timeout"
  | "database"
  | "auth"
  | "runtime"
  | "validation"
  | "integration"
  | "infra"
  | "unknown"

export type PriorityLevel = "low" | "medium" | "high"

export interface ParsedIncident {
  title: string
  stackTrace: string[]
  breadcrumbs: string[]
  environment: string | null
  release: string | null
  route: string | null
  tags: Record<string, string>
}

export interface ClassificationResult {
  category: IncidentCategory
  confidence: number
  signals: string[]
}

export interface Recommendation {
  text: string
  specificity: number
}

export interface IncidentInsight {
  classification: ClassificationResult
  summary: string
  hypothesis: string
  recommendations: Recommendation[]
  priority: PriorityLevel
  firstUsefulFrame: string | null
  usefulFrames: string[]
}
