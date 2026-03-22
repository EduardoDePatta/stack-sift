import type * as tf from "@tensorflow/tfjs"

let cachedModel: tf.Sequential | null = null
let loadingPromise: Promise<tf.Sequential | null> | null = null

export function getCachedModel(): tf.Sequential | null {
  return cachedModel
}

export function setCachedModel(model: tf.Sequential | null): void {
  cachedModel = model
}

export function getLoadingPromise(): Promise<tf.Sequential | null> | null {
  return loadingPromise
}

export function setLoadingPromise(
  p: Promise<tf.Sequential | null> | null
): void {
  loadingPromise = p
}

export function clearModelLoaderState(): void {
  cachedModel = null
  loadingPromise = null
}
