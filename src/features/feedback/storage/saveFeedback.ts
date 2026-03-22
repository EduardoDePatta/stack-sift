import type { IncidentCategory } from "~/shared/types/incident"
import type { MLFeatures } from "~/features/ml/types"
import type { FeedbackExample } from "../types"
import { buildFingerprint } from "./buildFingerprint"
import { generateId, readStore, writeStore } from "./internal"

export async function saveFeedback(
  features: MLFeatures,
  category: IncidentCategory
): Promise<FeedbackExample> {
  const store = await readStore()
  const fp = buildFingerprint(features)

  const existingIdx = store.examples.findIndex((ex) => ex.fingerprint === fp)
  if (existingIdx >= 0) {
    store.examples[existingIdx].category = category
    store.examples[existingIdx].timestamp = Date.now()
    await writeStore(store)
    return store.examples[existingIdx]
  }

  const example: FeedbackExample = {
    id: generateId(),
    fingerprint: fp,
    features,
    category,
    timestamp: Date.now()
  }
  store.examples.push(example)
  await writeStore(store)
  return example
}
