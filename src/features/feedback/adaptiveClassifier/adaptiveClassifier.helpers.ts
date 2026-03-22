import type { IncidentCategory } from "~/shared/types/incident"
import type { MLFeatures } from "~/features/ml/types"
import type { FeedbackExample } from "../types"
import { textSimilarity } from "~/features/feedback/textSimilarity/textSimilarity"
import {
  ADAPTIVE_NEIGHBOR_K,
  MIN_FEEDBACK_SIMILARITY
} from "./data/adaptiveConstants"

export interface ScoredNeighbor {
  category: IncidentCategory
  similarity: number
}

export function findNeighbors(
  features: MLFeatures,
  examples: FeedbackExample[]
): ScoredNeighbor[] {
  const inputText = features.concatenatedText

  const scored: ScoredNeighbor[] = []
  for (const ex of examples) {
    const sim = textSimilarity(inputText, ex.features.concatenatedText)
    if (sim >= MIN_FEEDBACK_SIMILARITY) {
      scored.push({ category: ex.category, similarity: sim })
    }
  }

  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, ADAPTIVE_NEIGHBOR_K)
}

export function weightedVote(
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
