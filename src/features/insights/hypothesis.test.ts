import { describe, expect, it } from "vitest"
import type { IncidentCategory } from "~/shared/types/incident"
import { buildHypothesis } from "./buildHypothesis"

const ALL_CATEGORIES: IncidentCategory[] = [
  "timeout",
  "database",
  "auth",
  "runtime",
  "validation",
  "integration",
  "infra",
  "unknown"
]

describe("buildHypothesis", () => {
  it.each(ALL_CATEGORIES)(
    "returns a non-empty hypothesis for %s",
    (category) => {
      const result = buildHypothesis(category)
      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(20)
    }
  )

  it("returns relevant content for timeout", () => {
    const result = buildHypothesis("timeout")
    expect(result.toLowerCase()).toContain("slow")
  })

  it("returns relevant content for database", () => {
    const result = buildHypothesis("database")
    expect(result.toLowerCase()).toContain("database")
  })

  it("returns relevant content for auth", () => {
    const result = buildHypothesis("auth")
    expect(result.toLowerCase()).toContain("token")
  })

  it("returns relevant content for runtime", () => {
    const result = buildHypothesis("runtime")
    expect(result.toLowerCase()).toContain("runtime")
  })

  it("returns relevant content for unknown", () => {
    const result = buildHypothesis("unknown")
    expect(result.toLowerCase()).toContain("manual")
  })
})
