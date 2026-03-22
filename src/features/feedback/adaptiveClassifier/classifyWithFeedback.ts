import type { MLClassificationResult, MLFeatures } from "~/features/ml/types"
import type { FeedbackExample } from "../types"
import {
  findNeighbors,
  weightedVote
} from "./adaptiveClassifier.helpers"

export function classifyWithFeedback(
  features: MLFeatures,
  examples: FeedbackExample[]
): MLClassificationResult | null {
  if (examples.length < 2) return null

  const neighbors = findNeighbors(features, examples)
  const vote = weightedVote(neighbors)

  if (!vote || vote.category === "unknown") return null

  const topSim = neighbors[0]?.similarity ?? 0

  return {
    category: vote.category,
    confidence: Math.round(Math.min(vote.confidence * topSim + 0.3, 1) * 100) / 100,
    signals: [
      `adaptive:${vote.category}`,
      `adaptive:n=${examples.length}`,
      `adaptive:sim=${topSim.toFixed(2)}`,
      `adaptive:k=${neighbors.length}`
    ]
  }
}
