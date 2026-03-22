import { VENDOR_PATTERNS } from "./data/vendorPatterns"

export function containsAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t))
}

export function containsAnyInLines(lines: string[], terms: string[]): boolean {
  const joined = lines.join("\n").toLowerCase()
  return terms.some((t) => joined.includes(t))
}

export function isVendorFrame(frame: string): boolean {
  const lower = frame.toLowerCase()
  return VENDOR_PATTERNS.some((p) => lower.includes(p))
}

export function extractErrorClass(title: string): string {
  const match = title.match(/^([A-Z][a-zA-Z]*Error)/)
  return match ? match[1].toLowerCase() : ""
}

export function extractHTTPMethod(route: string | null): string | null {
  if (!route) return null
  const match = route.match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/i)
  return match ? match[1].toUpperCase() : null
}

export function countRouteSegments(route: string | null): number {
  if (!route) return 0
  const path = route.replace(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+/i, "")
  return path.split("/").filter((s) => s.length > 0).length
}

export function extractLastHTTPStatus(breadcrumbs: string[]): number | null {
  for (let i = breadcrumbs.length - 1; i >= 0; i--) {
    const match = breadcrumbs[i].match(/\[(\d{3})\]/)
    if (match) return parseInt(match[1], 10)
  }
  return null
}

export function hasHTTPStatusRange(text: string, min: number, max: number): boolean {
  const matches = text.match(/\b[1-5]\d{2}\b/g)
  if (!matches) return false
  return matches.some((m) => {
    const code = parseInt(m, 10)
    return code >= min && code <= max
  })
}
