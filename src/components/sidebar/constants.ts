import type { IncidentCategory } from "~/shared/types/incident"

export const PRIORITY_COLORS: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#16a34a"
}

export const ALL_FEEDBACK_CATEGORIES: IncidentCategory[] = [
  "timeout",
  "database",
  "auth",
  "runtime",
  "validation",
  "integration",
  "infra",
  "unknown"
]
