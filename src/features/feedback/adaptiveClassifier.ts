import type { IncidentCategory } from "~/shared/types/incident"
import type { MLFeatures } from "~/features/ml/types"
import type { MLClassificationResult } from "~/features/ml/types"
import type { FeedbackExample } from "./types"
import { textSimilarity } from "./textSimilarity"

const MIN_SIMILARITY = 0.25
const K = 5

interface ScoredNeighbor {
  category: IncidentCategory
  similarity: number
}

function findNeighbors(
  features: MLFeatures,
  examples: FeedbackExample[]
): ScoredNeighbor[] {
  const inputText = features.concatenatedText

  const scored: ScoredNeighbor[] = []
  for (const ex of examples) {
    const sim = textSimilarity(inputText, ex.features.concatenatedText)
    if (sim >= MIN_SIMILARITY) {
      scored.push({ category: ex.category, similarity: sim })
    }
  }

  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, K)
}

function weightedVote(
  neighbors: ScoredNeighbor[]
): { category: IncidentCategory; confidence: number } | null {
  if (neighbors.length === 0) return null

  const votes = new Map<IncidentCategory, number>()
  let totalWeight = 0

  for (const n of neighbors) {
    const weight = n.similarity * n.similarity
    votes.set(n.category, (votes.get(n.category) ?? 0) + weight)
    totalWeight += weight
  }

  let bestCategory: IncidentCategory = "unknown"
  let bestWeight = 0
  for (const [cat, weight] of votes) {
    if (weight > bestWeight) {
      bestWeight = weight
      bestCategory = cat
    }
  }

  const confidence = totalWeight > 0 ? bestWeight / totalWeight : 0
  return { category: bestCategory, confidence }
}

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
