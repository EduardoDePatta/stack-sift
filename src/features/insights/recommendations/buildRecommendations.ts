import type {
  IncidentCategory,
  ParsedIncident,
  Recommendation
} from "~/shared/types/incident"
import { buildHypothesis } from "~/features/insights/buildHypothesis"
import { RULES_BY_CATEGORY } from "./data/rulesByCategory"
import {
  buildSearchText,
  matchesAllPatterns
} from "./recommendations.helpers"

export function buildRecommendations(
  incident: ParsedIncident,
  category: IncidentCategory
): Recommendation[] {
  const searchText = buildSearchText(incident)
  const results: Recommendation[] = []

  const categoryRules = RULES_BY_CATEGORY[category]
  if (categoryRules) {
    for (const rule of categoryRules) {
      if (matchesAllPatterns(searchText, rule.patterns)) {
        results.push({ text: rule.text, specificity: rule.specificity })
      }
    }
  }

  const allRules = Object.entries(RULES_BY_CATEGORY)
  for (const [cat, rules] of allRules) {
    if (cat === category) continue
    for (const rule of rules!) {
      if (matchesAllPatterns(searchText, rule.patterns)) {
        results.push({
          text: rule.text,
          specificity: rule.specificity * 0.5
        })
      }
    }
  }

  results.sort((a, b) => b.specificity - a.specificity)

  const seen = new Set<string>()
  const unique = results.filter((r) => {
    if (seen.has(r.text)) return false
    seen.add(r.text)
    return true
  })

  if (unique.length === 0) {
    return [{ text: buildHypothesis(category), specificity: 0 }]
  }

  return unique.slice(0, 5)
}
