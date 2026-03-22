import type { MLFeatures } from "~/features/ml/types"

export function buildFingerprint(features: MLFeatures): string {
  const title = features.titleText.trim().slice(0, 120)
  const stack = features.stackText.trim().slice(0, 200)
  return `${title}::${stack}`
}
