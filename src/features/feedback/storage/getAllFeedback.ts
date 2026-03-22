import type { FeedbackExample } from "../types"
import { readStore } from "./internal"

export async function getAllFeedback(): Promise<FeedbackExample[]> {
  const store = await readStore()
  return store.examples
}
