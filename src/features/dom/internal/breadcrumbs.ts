export function extractBreadcrumbs(doc: Document): string[] {
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
