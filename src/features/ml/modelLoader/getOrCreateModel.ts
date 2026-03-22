import type * as tf from "@tensorflow/tfjs"
import { createModel } from "../tfModel/createModel"
import { getModel } from "./getModel"
import { setCachedModel } from "./modelLoaderState"

export async function getOrCreateModel(): Promise<tf.Sequential> {
  const existing = await getModel()
  if (existing) return existing

  const model = createModel()
  setCachedModel(model)
  return model
}
