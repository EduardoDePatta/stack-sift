import { textOf } from "./text"

export function extractStackTrace(doc: Document): string[] {
  const frames: string[] = []

  const lines = doc.querySelectorAll('[data-test-id="line"]')
  if (lines.length > 0) {
    lines.forEach((line) => {
      const filename = textOf(line.querySelector('[data-test-id="filename"]'))
      const fn = textOf(line.querySelector('[data-test-id="function"]'))
      if (filename && fn) {
        frames.push(`${filename} in ${fn}`)
      } else if (filename) {
        frames.push(filename)
      } else {
        const fallback = textOf(line)
        if (fallback) frames.push(fallback)
      }
    })
    return frames
  }

  const preBlocks = doc.querySelectorAll("pre")
  for (const pre of preBlocks) {
    const text = pre.textContent?.trim() ?? ""
    if (text.includes(" at ") || text.includes("Traceback")) {
      const textLines = text
        .split("\n")
        .filter((l) => l.trim().length > 0)
      frames.push(...textLines)
      return frames
    }
  }

  return frames
}
