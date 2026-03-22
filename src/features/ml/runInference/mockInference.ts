import type { IncidentCategory } from "~/shared/types/incident"
import type { MLClassificationResult, MLFeatures } from "../types"

export function mockInference(features: MLFeatures): MLClassificationResult {
  const flagMap: Array<{ flag: boolean; category: IncidentCategory }> = [
    { flag: features.hasTimeoutTerms, category: "timeout" },
    { flag: features.hasDatabaseTerms, category: "database" },
    { flag: features.hasAuthTerms, category: "auth" },
    { flag: features.hasRuntimeErrorTerms, category: "runtime" },
    { flag: features.hasValidationTerms, category: "validation" },
    { flag: features.hasIntegrationTerms, category: "integration" },
    { flag: features.hasInfraTerms, category: "infra" }
  ]

  const matched = flagMap.filter((f) => f.flag)

  if (matched.length === 0) {
    return { category: "unknown", confidence: 0, signals: ["mock:no-match"] }
  }

  if (matched.length === 1) {
    return {
      category: matched[0].category,
      confidence: 0.6,
      signals: [`mock:${matched[0].category}`]
    }
  }

  return {
    category: matched[0].category,
    confidence: 0.4,
    signals: matched.map((m) => `mock:${m.category}`)
  }
}
