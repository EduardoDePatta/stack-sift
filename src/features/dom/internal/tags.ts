import { textOf } from "./text"

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

export function extractTagValue(
  doc: Document,
  tagName: string
): string | null {
  const rows = collectTagRows(doc)
  const match = rows.find(
    (r) => r.key.toLowerCase() === tagName.toLowerCase()
  )
  return match?.value ?? null
}

export function extractTags(doc: Document): Record<string, string> {
  const tags: Record<string, string> = {}
  for (const { key, value } of collectTagRows(doc)) {
    tags[key] = value
  }
  return tags
}
