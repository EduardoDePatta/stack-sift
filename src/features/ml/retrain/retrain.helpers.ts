import type { FeedbackExample } from "~/features/feedback/types"
import { featureObjectToArray } from "../featureObjectToArray"
import { RETRAIN_CATEGORY_NAMES } from "./data/retrainConstants"

export function feedbackToTrainingRow(
  example: FeedbackExample
): { features: number[]; category: number } | null {
  const catIdx = RETRAIN_CATEGORY_NAMES.indexOf(
    example.category as (typeof RETRAIN_CATEGORY_NAMES)[number]
  )
  if (catIdx === -1) return null

  const features = featureObjectToArray(
    example.features as unknown as Record<string, unknown>
  )
  return { features, category: catIdx }
}
