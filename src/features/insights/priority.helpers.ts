import { SENSITIVE_ROUTE_PATTERNS } from "./data/sensitiveRoutePatterns"

export function isProduction(environment: string | null): boolean {
  if (!environment) return false
  const env = environment.toLowerCase()
  return env === "production" || env === "prod"
}

export function matchesSensitivePattern(text: string): boolean {
  const lower = text.toLowerCase()
  return SENSITIVE_ROUTE_PATTERNS.some((p) => lower.includes(p))
}

export function isSensitiveRoute(
  route: string | null,
  url: string | null
): boolean {
  if (route && matchesSensitivePattern(route)) return true
  if (url && matchesSensitivePattern(url)) return true
  return false
}
