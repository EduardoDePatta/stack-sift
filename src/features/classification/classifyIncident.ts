import type {
  ClassificationResult,
  IncidentCategory,
  ParsedIncident
} from "~/shared/types/incident"
import { buildSearchText, matchCategory } from "./classifyIncident.helpers"
import { CATEGORY_RULES } from "./data/categoryRules"

export function classifyIncident(
  incident: ParsedIncident
): ClassificationResult {
  const searchText = buildSearchText(incident)

  let bestCategory: IncidentCategory = "unknown"
  let bestSignals: string[] = []
  let bestScore = 0

  for (const rule of CATEGORY_RULES) {
    const matched = matchCategory(searchText, rule)
    if (matched.length > bestScore) {
      bestScore = matched.length
      bestCategory = rule.category
      bestSignals = matched
    }
  }

  const confidence =
    bestScore === 0 ? 0 : Math.min(bestScore / 3, 1)

  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    signals: bestSignals
  }
}
