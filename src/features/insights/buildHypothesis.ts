import type { IncidentCategory } from "~/shared/types/incident"
import { HYPOTHESES } from "./data/hypothesesByCategory"

export function buildHypothesis(category: IncidentCategory): string {
  return HYPOTHESES[category]
}
