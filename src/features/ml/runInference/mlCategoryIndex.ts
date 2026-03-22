import type { IncidentCategory } from "~/shared/types/incident"

export const ML_CATEGORY_INDEX: IncidentCategory[] = [
  "timeout",
  "database",
  "auth",
  "runtime",
  "validation",
  "integration",
  "infra",
  "unknown"
]
