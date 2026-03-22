import * as tf from "@tensorflow/tfjs"
import { NUM_CATEGORIES, NUM_FEATURES } from "./constants"

export function createModel(): tf.Sequential {
  const model = tf.sequential()

  model.add(
    tf.layers.dense({
      inputShape: [NUM_FEATURES],
      units: 32,
      activation: "relu"
    })
  )

  model.add(
    tf.layers.dense({
      units: 16,
      activation: "relu"
    })
  )

  model.add(
    tf.layers.dense({
      units: NUM_CATEGORIES,
      activation: "softmax"
    })
  )

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "sparseCategoricalCrossentropy",
    metrics: ["accuracy"]
  })

  return model
}
