import type { FeedbackStore } from "../types"

export const STORAGE_KEY = "stack-sift-feedback"

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function readStore(): Promise<FeedbackStore> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    const store = result[STORAGE_KEY] as FeedbackStore | undefined
    return store ?? { examples: [] }
  } catch {
    return { examples: [] }
  }
}

export async function writeStore(store: FeedbackStore): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: store })
}
