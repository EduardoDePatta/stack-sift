import { describe, expect, it } from "vitest"
import type { ParsedIncident } from "~/shared/types/incident"
import { buildSummary } from "./buildSummary"

function makeIncident(overrides: Partial<ParsedIncident> = {}): ParsedIncident {
  return {
    title: "Something went wrong",
    stackTrace: [],
    breadcrumbs: [],
    environment: null,
    release: null,
    route: null,
    tags: {},
    ...overrides
  }
}

describe("buildSummary", () => {
  it("includes category label and title", () => {
    const result = buildSummary(
      "timeout",
      makeIncident({ title: "ETIMEDOUT on payment service" })
    )
    expect(result).toBe("Timeout issue: ETIMEDOUT on payment service")
  })

  it("includes environment when present", () => {
    const result = buildSummary(
      "database",
      makeIncident({
        title: "Query failed",
        environment: "production"
      })
    )
    expect(result).toBe("Database issue in production: Query failed")
  })

  it("omits environment when null", () => {
    const result = buildSummary(
      "auth",
      makeIncident({ title: "Unauthorized" })
    )
    expect(result).toBe("Authentication issue: Unauthorized")
  })

  it("truncates long titles to 80 chars", () => {
    const longTitle = "A".repeat(100)
    const result = buildSummary("unknown", makeIncident({ title: longTitle }))
    expect(result).toContain("A".repeat(77) + "...")
    expect(result.length).toBeLessThan(100 + 30)
  })

  it("handles runtime category", () => {
    const result = buildSummary(
      "runtime",
      makeIncident({ title: "Cannot read properties of undefined" })
    )
    expect(result).toContain("Frontend Runtime issue")
  })

  it("handles unknown category", () => {
    const result = buildSummary(
      "unknown",
      makeIncident({ title: "Weird error" })
    )
    expect(result).toBe("Unclassified issue: Weird error")
  })
})
