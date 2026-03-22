import type { IncidentCategory, ParsedIncident } from "~/shared/types/incident"
import { CATEGORY_LABELS } from "./data/categoryLabels"
import { truncate } from "./summary.helpers"

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
