import * as tf from "@tensorflow/tfjs"
import { MODEL_DB_KEY } from "./constants"

export async function saveModel(model: tf.Sequential): Promise<void> {
  await model.save(MODEL_DB_KEY)
}
