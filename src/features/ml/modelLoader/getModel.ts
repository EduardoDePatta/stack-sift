import type * as tf from "@tensorflow/tfjs"
import { loadModel } from "../tfModel/loadModel"
import {
  getCachedModel,
  getLoadingPromise,
  setCachedModel,
  setLoadingPromise
} from "./modelLoaderState"

export async function getModel(): Promise<tf.Sequential | null> {
  const cached = getCachedModel()
  if (cached) return cached

  let p = getLoadingPromise()
  if (!p) {
    p = loadModel()
      .then((model) => {
        setCachedModel(model)
        return model
      })
      .catch(() => null)
      .finally(() => {
        setLoadingPromise(null)
      })
    setLoadingPromise(p)
  }
  return p
}
