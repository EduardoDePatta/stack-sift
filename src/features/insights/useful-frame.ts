const VENDOR_PATTERNS = [
  "node_modules",
  "webpack",
  "react-dom",
  "next/dist",
  "@babel",
  "regenerator-runtime",
  "core-js",
  "tslib",
  "internal/process",
  "node:internal",
  "native code"
]

const ERROR_HANDLER_PATTERNS = [
  "handleerror",
  "handle-error",
  "throwerror",
  "throw-error",
  "errorhandler",
  "error-handler",
  "handlev3error",
  "handlev2error",
  "handleapierror",
  "handlehttperror",
  "wrapperror",
  "rethrow",
  "reporterror",
  "captureerror",
  "logerror",
  "onuncaughterror",
  "handleexception",
  "exceptionhandler",
  "processerror"
]

const BOILERPLATE_PATTERNS = [
  "in rejected",
  "in fulfilled",
  "generator.throw",
  "generator.next",
  "step(generator",
  "__awaiter",
  "asyncgenerator",
  "tslib.__awaiter",
  "eval at <anonymous>"
]

function isVendorFrame(frame: string): boolean {
  const lower = frame.toLowerCase()
  return VENDOR_PATTERNS.some((pattern) => lower.includes(pattern))
}

function isErrorHandlerFrame(frame: string): boolean {
  const lower = frame.toLowerCase().replace(/[\s_]/g, "")
  return ERROR_HANDLER_PATTERNS.some((pattern) => lower.includes(pattern))
}

function isBoilerplateFrame(frame: string): boolean {
  const lower = frame.toLowerCase()
  return BOILERPLATE_PATTERNS.some((pattern) => lower.includes(pattern))
}

function looksLikeCodeFrame(frame: string): boolean {
  return /\.(ts|js|tsx|jsx|mjs|cjs)/.test(frame)
}

export function findAllUsefulFrames(stackTrace: string[]): string[] {
  const frames: string[] = []
  for (const frame of stackTrace) {
    const trimmed = frame.trim()
    if (trimmed.length === 0) continue
    if (isVendorFrame(trimmed)) continue
    if (!looksLikeCodeFrame(trimmed)) continue
    frames.push(trimmed)
  }
  return frames
}

export function findFirstUsefulFrame(
  stackTrace: string[]
): string | null {
  const useful = findAllUsefulFrames(stackTrace)
  if (useful.length === 0) {
    for (const frame of stackTrace) {
      const trimmed = frame.trim()
      if (trimmed.length === 0) continue
      if (!isVendorFrame(trimmed)) return trimmed
    }
    return null
  }

  for (const frame of useful) {
    if (!isErrorHandlerFrame(frame) && !isBoilerplateFrame(frame)) {
      return frame
    }
  }

  return useful[useful.length - 1]
}
