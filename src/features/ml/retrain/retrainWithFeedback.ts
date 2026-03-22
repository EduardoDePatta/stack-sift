import { getAllFeedback } from "~/features/feedback/storage"
import { SYNTHETIC_DATA } from "../data/syntheticData"
import { createModel } from "../tfModel/createModel"
import { loadModel } from "../tfModel/loadModel"
import { saveModel } from "../tfModel/saveModel"
import { trainModel } from "../tfModel/trainModel"
import { FEEDBACK_WEIGHT } from "./data/retrainConstants"
import { feedbackToTrainingRow } from "./retrain.helpers"
import type { RetrainProgress, RetrainResult } from "./retrainTypes"

export async function retrainWithFeedback(
  onProgress?: (progress: RetrainProgress) => void
): Promise<RetrainResult> {
  try {
    const feedbackExamples = await getAllFeedback()

    const feedbackRows = feedbackExamples
      .map(feedbackToTrainingRow)
      .filter((r): r is NonNullable<typeof r> => r !== null)

    const allX: number[][] = []
    const allY: number[] = []

    for (const item of SYNTHETIC_DATA) {
      allX.push(item.features)
      allY.push(item.category)
    }

    for (let i = 0; i < FEEDBACK_WEIGHT; i++) {
      for (const row of feedbackRows) {
        allX.push(row.features)
        allY.push(row.category)
      }
    }

    const model = (await loadModel()) ?? createModel()

    const epochs = 20
    const trainResult = await trainModel(model, allX, allY, {
      epochs,
      batchSize: 32,
      validationSplit: 0.15,
      onEpochEnd: onProgress
        ? (epoch, logs) => {
            onProgress({
              epoch: epoch + 1,
              totalEpochs: epochs,
              loss: logs.loss,
              accuracy: logs.acc
            })
          }
        : undefined
    })

    await saveModel(model)

    return {
      success: true,
      trainResult,
      totalExamples: allX.length,
      feedbackCount: feedbackRows.length
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
