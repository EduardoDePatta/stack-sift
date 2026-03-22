import { writeStore } from "./internal"

export async function clearFeedback(): Promise<void> {
  await writeStore({ examples: [] })
}
