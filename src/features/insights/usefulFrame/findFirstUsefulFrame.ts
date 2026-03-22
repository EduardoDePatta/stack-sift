import { findAllUsefulFrames } from "./findAllUsefulFrames"
import {
  isBoilerplateFrame,
  isErrorHandlerFrame,
  isVendorFrame
} from "./usefulFrame.helpers"

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
