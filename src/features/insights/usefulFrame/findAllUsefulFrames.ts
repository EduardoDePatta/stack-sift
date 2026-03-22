import {
  isVendorFrame,
  looksLikeCodeFrame
} from "./usefulFrame.helpers"

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
