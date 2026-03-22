import type { IncidentCategory } from "~/shared/types/incident"

export const HIGH_PRIORITY_CATEGORIES: Set<IncidentCategory> = new Set([
  "timeout",
  "database"
])
