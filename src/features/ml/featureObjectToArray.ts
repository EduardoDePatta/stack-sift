import { FEATURE_KEYS } from "./data/featureKeys"
import { LEGACY_FEATURE_ALIASES } from "./data/legacyFeatureAliases"

export function featureObjectToArray(
  obj: Record<string, unknown>
): number[] {
  const normalized: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    const canonical = LEGACY_FEATURE_ALIASES[key] ?? key
    normalized[canonical] = val
  }

  return FEATURE_KEYS.map((key) => {
    const val = normalized[key]
    if (val === undefined || val === null) return 0
    if (typeof val === "boolean") return val ? 1.0 : 0.0
    return Number(val) || 0
  })
}
