import { BOILERPLATE_PATTERNS } from "./data/boilerplatePatterns"
import { ERROR_HANDLER_PATTERNS } from "./data/errorHandlerPatterns"
import { VENDOR_PATTERNS } from "./data/vendorPatterns"

export function isVendorFrame(frame: string): boolean {
  const lower = frame.toLowerCase()
  return VENDOR_PATTERNS.some((pattern) => lower.includes(pattern))
}

export function isErrorHandlerFrame(frame: string): boolean {
  const lower = frame.toLowerCase().replace(/[\s_]/g, "")
  return ERROR_HANDLER_PATTERNS.some((pattern) => lower.includes(pattern))
}

export function isBoilerplateFrame(frame: string): boolean {
  const lower = frame.toLowerCase()
  return BOILERPLATE_PATTERNS.some((pattern) => lower.includes(pattern))
}

export function looksLikeCodeFrame(frame: string): boolean {
  return /\.(ts|js|tsx|jsx|mjs|cjs)/.test(frame)
}
