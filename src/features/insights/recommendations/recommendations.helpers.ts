import type { ParsedIncident } from "~/shared/types/incident"

export function buildSearchText(incident: ParsedIncident): string {
  return [incident.title, ...incident.stackTrace, ...incident.breadcrumbs]
    .join("\n")
    .toLowerCase()
}

export function matchesAllPatterns(text: string, patterns: string[]): boolean {
  return patterns.every((p) => text.includes(p))
}
