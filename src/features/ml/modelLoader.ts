import { InferenceSession } from "onnxruntime-web"

let cachedSession: InferenceSession | null = null
let loadingPromise: Promise<InferenceSession | null> | null = null

export async function getModelSession(): Promise<InferenceSession | null> {
  if (cachedSession) return cachedSession
  if (loadingPromise) return loadingPromise

  loadingPromise = InferenceSession.create("/assets/model.onnx")
    .then((session) => {
      cachedSession = session
      return session
    })
    .catch(() => {
      return null
    })
    .finally(() => {
      loadingPromise = null
    })

  return loadingPromise
}

export function resetModelCache(): void {
  cachedSession = null
  loadingPromise = null
}
