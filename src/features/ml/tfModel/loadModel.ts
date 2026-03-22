import * as tf from "@tensorflow/tfjs"
import { MODEL_DB_KEY } from "./constants"

export async function loadModel(): Promise<tf.Sequential | null> {
  try {
    const model = (await tf.loadLayersModel(MODEL_DB_KEY)) as tf.Sequential
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "sparseCategoricalCrossentropy",
      metrics: ["accuracy"]
    })
    return model
  } catch {
    return null
  }
}
