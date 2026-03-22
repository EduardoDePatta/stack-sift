import type { IncidentCategory, ParsedIncident } from "~/shared/types/incident"

const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  timeout: "Timeout",
  database: "Database",
  auth: "Authentication",
  "runtime": "Frontend Runtime",
  validation: "Validation",
  integration: "Integration",
  infra: "Infrastructure",
  unknown: "Unclassified"
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

export function buildSummary(
  category: IncidentCategory,
  incident: ParsedIncident
): string {
  const label = CATEGORY_LABELS[category]
  const title = truncate(incident.title, 80)
  const env = incident.environment
    ? ` in ${incident.environment}`
    : ""

  return `${label} issue${env}: ${title}`
}
