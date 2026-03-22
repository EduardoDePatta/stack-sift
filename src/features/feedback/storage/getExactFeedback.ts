import type { MLFeatures } from "~/features/ml/types"
import type { FeedbackExample } from "../types"
import { buildFingerprint } from "./buildFingerprint"
import { readStore } from "./internal"

export async function getExactFeedback(
  features: MLFeatures
): Promise<FeedbackExample | null> {
  const store = await readStore()
  const fp = buildFingerprint(features)
  return store.examples.find((ex) => ex.fingerprint === fp) ?? null
}
