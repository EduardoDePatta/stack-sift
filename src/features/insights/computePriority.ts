import type { IncidentCategory, PriorityLevel } from "~/shared/types/incident"
import { HIGH_PRIORITY_CATEGORIES } from "./data/highPriorityCategories"
import { isProduction, isSensitiveRoute } from "./priority.helpers"

export function computePriority(
  category: IncidentCategory,
  environment: string | null,
  route: string | null,
  url?: string | null
): PriorityLevel {
  if (!isProduction(environment)) return "low"

  if (HIGH_PRIORITY_CATEGORIES.has(category)) return "high"
  if (isSensitiveRoute(route, url ?? null)) return "high"

  return "medium"
}
