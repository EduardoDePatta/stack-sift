import {
  JS_STACK_AT_FORMAT,
  SENTRY_FRAME_FORMAT
} from "./data/frameLineRegexes"
import { extractPathAndNumbers } from "./frameParser.helpers"

export interface ParsedFrame {
  filePath: string
  line: number | null
  column: number | null
  fn: string | null
}

export function parseFrame(frame: string): ParsedFrame | null {
  const trimmed = frame.trim()
  if (!trimmed) return null

  const sentryMatch = trimmed.match(SENTRY_FRAME_FORMAT)
  if (sentryMatch) {
    const { filePath, line, column } = extractPathAndNumbers(sentryMatch[1])
    return {
      filePath,
      line: sentryMatch[3] ? parseInt(sentryMatch[3], 10) : line,
      column: sentryMatch[4] ? parseInt(sentryMatch[4], 10) : column,
      fn: sentryMatch[2].trim()
    }
  }

  const jsMatch = trimmed.match(JS_STACK_AT_FORMAT)
  if (jsMatch) {
    return {
      filePath: jsMatch[2],
      line: jsMatch[3] ? parseInt(jsMatch[3], 10) : null,
      column: jsMatch[4] ? parseInt(jsMatch[4], 10) : null,
      fn: jsMatch[1]?.trim() ?? null
    }
  }

  const { filePath, line, column } = extractPathAndNumbers(trimmed)
  if (filePath.includes("/") || filePath.includes(".")) {
    return { filePath, line, column, fn: null }
  }

  return null
}
