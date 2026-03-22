import { readStore } from "./internal"

export async function exportFeedbackAsTrainingJSON(): Promise<string> {
  const { FEATURE_KEYS } = await import("~/features/ml/data/featureKeys")
  const { featureObjectToArray } = await import(
    "~/features/ml/featureObjectToArray"
  )
  const store = await readStore()
  const exported = store.examples.map((ex) => {
    const numericArray = featureObjectToArray(
      ex.features as unknown as Record<string, unknown>
    )
    const features: Record<string, number> = {}
    for (let i = 0; i < FEATURE_KEYS.length; i++) {
      features[FEATURE_KEYS[i]] = numericArray[i]
    }
    return { features, correctedCategory: ex.category }
  })
  return JSON.stringify(exported, null, 2)
}
