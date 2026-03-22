export function textOf(el: Element | null): string | null {
  const text = el?.textContent?.trim()
  return text && text.length > 0 ? text : null
}
