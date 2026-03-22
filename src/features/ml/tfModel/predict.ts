import * as tf from "@tensorflow/tfjs"
import type { Tensor } from "@tensorflow/tfjs"
import { NUM_FEATURES } from "./constants"

export function predict(
  model: tf.Sequential,
  features: number[]
): { probabilities: number[]; predictedIndex: number } {
  const input = tf.tensor2d([features], [1, NUM_FEATURES])

  try {
    const output = model.predict(input) as Tensor
    const probabilities = Array.from(output.dataSync())
    output.dispose()

    let maxIdx = 0
    let maxVal = -Infinity
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxVal) {
        maxVal = probabilities[i]
        maxIdx = i
      }
    }

    return { probabilities, predictedIndex: maxIdx }
  } finally {
    input.dispose()
  }
}
