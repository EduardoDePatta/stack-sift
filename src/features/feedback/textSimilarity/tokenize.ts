import { TEXT_STOP_WORDS } from "./data/stopWords"

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_./\-:]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !TEXT_STOP_WORDS.has(t))
}
