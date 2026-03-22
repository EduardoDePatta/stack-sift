import * as tf from "@tensorflow/tfjs"
import { NUM_FEATURES } from "./constants"
import type { TrainOptions, TrainResult } from "./trainTypes"

export async function trainModel(
  model: tf.Sequential,
  xData: number[][],
  yData: number[],
  options?: TrainOptions
): Promise<TrainResult> {
  const epochs = options?.epochs ?? 20
  const batchSize = options?.batchSize ?? 32
  const validationSplit = options?.validationSplit ?? 0.15

  const xs = tf.tensor2d(xData, [xData.length, NUM_FEATURES])
  const ys = tf.tensor1d(yData, "float32")

  try {
    const history = await model.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit,
      shuffle: true,
      callbacks: options?.onEpochEnd
        ? {
            onEpochEnd: (epoch, logs) => {
              options.onEpochEnd!(epoch, {
                loss: (logs?.loss as number) ?? 0,
                acc: (logs?.acc as number) ?? 0
              })
            }
          }
        : undefined
    })

    const lossArr = history.history["loss"] as number[]
    const accArr = history.history["acc"] as number[]

    return {
      finalLoss: lossArr[lossArr.length - 1] ?? 0,
      finalAccuracy: accArr[accArr.length - 1] ?? 0,
      epochs
    }
  } finally {
    xs.dispose()
    ys.dispose()
  }
}
