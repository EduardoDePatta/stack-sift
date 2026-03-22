import type { MLFeatures } from "../types"

export const LEGACY_FEATURE_ALIASES: Record<string, keyof MLFeatures> = {
  hasFrontendTerms: "hasRuntimeErrorTerms"
}
