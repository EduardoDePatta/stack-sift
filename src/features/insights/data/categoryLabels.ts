import type { IncidentCategory } from "~/shared/types/incident"

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  timeout: "Timeout",
  database: "Database",
  auth: "Authentication",
  "runtime": "Frontend Runtime",
  validation: "Validation",
  integration: "Integration",
  infra: "Infrastructure",
  unknown: "Unclassified"
}
