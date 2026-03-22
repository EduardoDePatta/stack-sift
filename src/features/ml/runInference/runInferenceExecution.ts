import { getModel } from "../modelLoader"
import { predict } from "../tfModel/predict"
import type { MLClassificationResult, MLFeatures } from "../types"
import { featuresToArray } from "./featuresToArray"
import { mockInference } from "./mockInference"
import { parseModelOutput } from "./parseModelOutput"

export async function runInference(
  features: MLFeatures
): Promise<MLClassificationResult> {
  const model = await getModel()

  if (!model) {
    return mockInference(features)
  }

  try {
    const featureArray = featuresToArray(features)
    const { probabilities } = predict(model, featureArray)
    return parseModelOutput(probabilities)
  } catch {
    return mockInference(features)
  }
}
