import type { IncidentCategory, PriorityLevel } from "~/shared/types/incident"

const HIGH_PRIORITY_CATEGORIES: Set<IncidentCategory> = new Set([
  "timeout",
  "database"
])

const SENSITIVE_ROUTE_PATTERNS = [
  "payment",
  "checkout",
  "login",
  "auth",
  "signup",
  "register",
  "billing",
  "subscription"
]

function isProduction(environment: string | null): boolean {
  if (!environment) return false
  const env = environment.toLowerCase()
  return env === "production" || env === "prod"
}

function matchesSensitivePattern(text: string): boolean {
  const lower = text.toLowerCase()
  return SENSITIVE_ROUTE_PATTERNS.some((p) => lower.includes(p))
}

function isSensitiveRoute(
  route: string | null,
  url: string | null
): boolean {
  if (route && matchesSensitivePattern(route)) return true
  if (url && matchesSensitivePattern(url)) return true
  return false
}

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
