import type { ParsedIncident } from "~/shared/types/incident"

function textOf(el: Element | null): string | null {
  const text = el?.textContent?.trim()
  return text && text.length > 0 ? text : null
}

function extractTitle(doc: Document): string {
  const exceptionValue = doc.querySelector(
    '[data-test-id="exception-value"]'
  )
  if (exceptionValue) {
    const errorType = textOf(exceptionValue.querySelector("h5"))
    const errorMsg = textOf(exceptionValue.querySelector("pre"))
    if (errorType && errorMsg) return `${errorType}: ${errorMsg}`
    if (errorType) return errorType
    if (errorMsg) return errorMsg
  }

  const h1 = textOf(doc.querySelector("h1"))
  if (h1) return h1

  return ""
}

function extractStackTrace(doc: Document): string[] {
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

function extractBreadcrumbs(doc: Document): string[] {
  const breadcrumbs: string[] = []
  const container = doc.querySelector('[data-test-id="breadcrumbs"]')
  if (!container) return breadcrumbs

  const rows = container.querySelectorAll(
    '[data-test-id="value-unformatted"], li, tr'
  )
  rows.forEach((el) => {
    const text = el.textContent?.trim()
    if (text) breadcrumbs.push(text)
  })

  return breadcrumbs
}

function collectTagRows(
  doc: Document
): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = []
  const selectors =
    '[data-test-id="tag-tree-row"], [data-test-id="highlight-tag-row"]'

  const rows = doc.querySelectorAll(selectors)
  for (const row of rows) {
    const keyEl =
      row.querySelector('[data-sentry-element="TreeKey"]') ??
      row.querySelector('[data-sentry-element="TreeSearchKey"]')

    const key =
      keyEl?.getAttribute("title") ?? textOf(keyEl)
    if (!key) continue

    const trunk = row.querySelector(
      '[data-sentry-element="TreeKeyTrunk"]'
    )
    const children = Array.from(row.children)
    const valueContainer = trunk
      ? children.find((child) => child !== trunk)
      : children[1]

    const value = textOf(valueContainer ?? null)
    if (value) {
      result.push({ key, value })
    }
  }

  return result
}

function extractTagValue(
  doc: Document,
  tagName: string
): string | null {
  const rows = collectTagRows(doc)
  const match = rows.find(
    (r) => r.key.toLowerCase() === tagName.toLowerCase()
  )
  return match?.value ?? null
}

function extractTags(doc: Document): Record<string, string> {
  const tags: Record<string, string> = {}
  for (const { key, value } of collectTagRows(doc)) {
    tags[key] = value
  }
  return tags
}

export function extractIncidentFromDOM(doc: Document): ParsedIncident {
  return {
    title: extractTitle(doc),
    stackTrace: extractStackTrace(doc),
    breadcrumbs: extractBreadcrumbs(doc),
    environment: extractTagValue(doc, "environment"),
    release: extractTagValue(doc, "release"),
    route:
      extractTagValue(doc, "transaction") ??
      extractTagValue(doc, "url"),
    tags: extractTags(doc)
  }
}
