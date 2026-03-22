import { readStore } from "./internal"

export async function getFeedbackCount(): Promise<number> {
  const store = await readStore()
  return store.examples.length
}
