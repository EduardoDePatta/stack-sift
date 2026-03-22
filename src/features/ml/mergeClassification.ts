import type { ClassificationResult } from "~/shared/types/incident"
import type { MLClassificationResult } from "./types"

export function mergeClassification(
  heuristic: ClassificationResult,
  ml: MLClassificationResult,
  adaptive?: MLClassificationResult | null
): ClassificationResult {
  if (
    adaptive &&
    adaptive.confidence > 0.7 &&
    adaptive.category !== "unknown"
  ) {
    if (heuristic.category === "unknown") {
      return {
        category: adaptive.category,
        confidence: adaptive.confidence,
        signals: [...adaptive.signals]
      }
    }

    if (adaptive.category === heuristic.category) {
      const boosted = Math.min(
        Math.max(heuristic.confidence, adaptive.confidence) + 0.2,
        1
      )
      return {
        category: heuristic.category,
        confidence: Math.round(boosted * 100) / 100,
        signals: [
          ...new Set([...heuristic.signals, ...adaptive.signals])
        ]
      }
    }

    if (adaptive.confidence > 0.85 && heuristic.confidence < 0.5) {
      return {
        category: adaptive.category,
        confidence: adaptive.confidence,
        signals: [...adaptive.signals]
      }
    }
  }

  if (heuristic.confidence >= 0.85) {
    return heuristic
  }

  if (ml.confidence > 0.8 && heuristic.category === "unknown") {
    return {
      category: ml.category,
      confidence: ml.confidence,
      signals: [...ml.signals]
    }
  }

  if (ml.confidence > 0.8 && heuristic.confidence < 0.5) {
    return {
      category: ml.category,
      confidence: ml.confidence,
      signals: [...ml.signals]
    }
  }

  if (heuristic.category === ml.category && heuristic.category !== "unknown") {
    const boosted = Math.min(
      Math.max(heuristic.confidence, ml.confidence) + 0.15,
      1
    )
    const mergedSignals = [
      ...new Set([...heuristic.signals, ...ml.signals])
    ]
    return {
      category: heuristic.category,
      confidence: Math.round(boosted * 100) / 100,
      signals: mergedSignals
    }
  }

  return heuristic
}
