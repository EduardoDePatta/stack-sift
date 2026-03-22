import type { CategoryRule } from "./data/categoryRules"
import type { ParsedIncident } from "~/shared/types/incident"

export function buildSearchText(incident: ParsedIncident): string {
  return [incident.title, ...incident.stackTrace].join("\n").toLowerCase()
}

export function matchCategory(
  searchText: string,
  rule: CategoryRule
): string[] {
  return rule.keywords.filter((kw) => searchText.includes(kw))
}
