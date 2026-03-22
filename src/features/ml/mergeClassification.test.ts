import { describe, expect, it } from "vitest"
import type { ClassificationResult } from "~/shared/types/incident"
import type { MLClassificationResult } from "./types"
import { mergeClassification } from "./mergeClassification"

function makeHeuristic(
  overrides: Partial<ClassificationResult> = {}
): ClassificationResult {
  return {
    category: "unknown",
    confidence: 0,
    signals: [],
    ...overrides
  }
}

function makeML(
  overrides: Partial<MLClassificationResult> = {}
): MLClassificationResult {
  return {
    category: "unknown",
    confidence: 0,
    signals: [],
    ...overrides
  }
}

describe("mergeClassification", () => {
  describe("heuristic strong", () => {
    it("keeps heuristic when confidence >= 0.85", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "database",
          confidence: 0.85,
          signals: ["prisma", "sql", "query failed"]
        }),
        makeML({
          category: "timeout",
          confidence: 0.9,
          signals: ["model:timeout"]
        })
      )
      expect(result.category).toBe("database")
      expect(result.confidence).toBe(0.85)
      expect(result.signals).toContain("prisma")
    })

    it("keeps heuristic when confidence is 1.0", () => {
      const result = mergeClassification(
        makeHeuristic({ category: "timeout", confidence: 1.0, signals: ["timeout"] }),
        makeML({ category: "database", confidence: 0.95, signals: ["model:database"] })
      )
      expect(result.category).toBe("timeout")
    })
  })

  describe("ML overrides unknown heuristic", () => {
    it("uses ML when heuristic is unknown and ML is confident", () => {
      const result = mergeClassification(
        makeHeuristic({ category: "unknown", confidence: 0, signals: [] }),
        makeML({
          category: "auth",
          confidence: 0.85,
          signals: ["model:auth"]
        })
      )
      expect(result.category).toBe("auth")
      expect(result.confidence).toBe(0.85)
      expect(result.signals).toContain("model:auth")
    })

    it("does not override unknown when ML confidence <= 0.8", () => {
      const result = mergeClassification(
        makeHeuristic({ category: "unknown", confidence: 0 }),
        makeML({ category: "auth", confidence: 0.7, signals: ["model:auth"] })
      )
      expect(result.category).toBe("unknown")
    })
  })

  describe("ML overrides weak heuristic", () => {
    it("uses ML when heuristic is weak and ML is strong", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "validation",
          confidence: 0.33,
          signals: ["400"]
        }),
        makeML({
          category: "database",
          confidence: 0.85,
          signals: ["model:database"]
        })
      )
      expect(result.category).toBe("database")
      expect(result.confidence).toBe(0.85)
    })

    it("does not override when heuristic confidence >= 0.5", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "validation",
          confidence: 0.5,
          signals: ["validation"]
        }),
        makeML({
          category: "database",
          confidence: 0.85,
          signals: ["model:database"]
        })
      )
      expect(result.category).toBe("validation")
    })
  })

  describe("agreement", () => {
    it("boosts confidence when both agree", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "database",
          confidence: 0.67,
          signals: ["prisma", "query failed"]
        }),
        makeML({
          category: "database",
          confidence: 0.75,
          signals: ["model:database"]
        })
      )
      expect(result.category).toBe("database")
      expect(result.confidence).toBe(0.9)
      expect(result.signals).toContain("prisma")
      expect(result.signals).toContain("query failed")
      expect(result.signals).toContain("model:database")
    })

    it("caps boosted confidence at 1.0", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "timeout",
          confidence: 0.8,
          signals: ["timeout"]
        }),
        makeML({
          category: "timeout",
          confidence: 0.9,
          signals: ["model:timeout"]
        })
      )
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it("deduplicates signals", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "auth",
          confidence: 0.5,
          signals: ["unauthorized"]
        }),
        makeML({
          category: "auth",
          confidence: 0.5,
          signals: ["unauthorized", "model:auth"]
        })
      )
      const unauthorizedCount = result.signals.filter(
        (s) => s === "unauthorized"
      ).length
      expect(unauthorizedCount).toBe(1)
    })

    it("does not boost when both agree on unknown", () => {
      const result = mergeClassification(
        makeHeuristic({ category: "unknown", confidence: 0 }),
        makeML({ category: "unknown", confidence: 0 })
      )
      expect(result.category).toBe("unknown")
      expect(result.confidence).toBe(0)
    })
  })

  describe("conflict fallback", () => {
    it("keeps heuristic on conflict when no rule applies", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "validation",
          confidence: 0.67,
          signals: ["validation", "schema"]
        }),
        makeML({
          category: "database",
          confidence: 0.6,
          signals: ["model:database"]
        })
      )
      expect(result.category).toBe("validation")
      expect(result.confidence).toBe(0.67)
    })

    it("keeps heuristic when ML is also weak", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "timeout",
          confidence: 0.33,
          signals: ["timeout"]
        }),
        makeML({
          category: "infra",
          confidence: 0.4,
          signals: ["mock:no-match"]
        })
      )
      expect(result.category).toBe("timeout")
    })
  })

  describe("missing ML", () => {
    it("returns heuristic when ML returns unknown with 0", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "database",
          confidence: 0.67,
          signals: ["prisma", "query failed"]
        }),
        makeML({ category: "unknown", confidence: 0, signals: ["mock:no-match"] })
      )
      expect(result.category).toBe("database")
      expect(result.confidence).toBe(0.67)
    })
  })

  describe("adaptive classifier integration", () => {
    it("adaptive overrides unknown heuristic when confident", () => {
      const result = mergeClassification(
        makeHeuristic({ category: "unknown", confidence: 0, signals: [] }),
        makeML({ category: "unknown", confidence: 0, signals: [] }),
        makeML({
          category: "auth",
          confidence: 0.8,
          signals: ["adaptive:auth", "adaptive:n=10"]
        })
      )
      expect(result.category).toBe("auth")
      expect(result.confidence).toBe(0.8)
      expect(result.signals).toContain("adaptive:auth")
    })

    it("adaptive boosts heuristic when they agree", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "database",
          confidence: 0.67,
          signals: ["prisma"]
        }),
        makeML({ category: "unknown", confidence: 0, signals: [] }),
        makeML({
          category: "database",
          confidence: 0.75,
          signals: ["adaptive:database"]
        })
      )
      expect(result.category).toBe("database")
      expect(result.confidence).toBeGreaterThan(0.75)
      expect(result.signals).toContain("prisma")
      expect(result.signals).toContain("adaptive:database")
    })

    it("strong adaptive overrides weak heuristic", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "validation",
          confidence: 0.33,
          signals: ["400"]
        }),
        makeML({ category: "unknown", confidence: 0, signals: [] }),
        makeML({
          category: "auth",
          confidence: 0.9,
          signals: ["adaptive:auth"]
        })
      )
      expect(result.category).toBe("auth")
      expect(result.confidence).toBe(0.9)
    })

    it("does not override strong heuristic even with adaptive", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "database",
          confidence: 0.85,
          signals: ["prisma"]
        }),
        makeML({ category: "unknown", confidence: 0, signals: [] }),
        makeML({
          category: "timeout",
          confidence: 0.9,
          signals: ["adaptive:timeout"]
        })
      )
      expect(result.category).toBe("database")
      expect(result.confidence).toBe(0.85)
    })

    it("ignores adaptive when confidence is low", () => {
      const result = mergeClassification(
        makeHeuristic({
          category: "validation",
          confidence: 0.67,
          signals: ["validation"]
        }),
        makeML({ category: "unknown", confidence: 0, signals: [] }),
        makeML({
          category: "auth",
          confidence: 0.5,
          signals: ["adaptive:auth"]
        })
      )
      expect(result.category).toBe("validation")
    })

    it("ignores adaptive when null", () => {
      const result = mergeClassification(
        makeHeuristic({ category: "database", confidence: 0.67, signals: ["prisma"] }),
        makeML({ category: "unknown", confidence: 0, signals: [] }),
        null
      )
      expect(result.category).toBe("database")
    })

    it("ignores adaptive when undefined", () => {
      const result = mergeClassification(
        makeHeuristic({ category: "database", confidence: 0.67, signals: ["prisma"] }),
        makeML({ category: "unknown", confidence: 0, signals: [] }),
        undefined
      )
      expect(result.category).toBe("database")
    })

    it("adaptive has priority over ML mock when both are confident", () => {
      const result = mergeClassification(
        makeHeuristic({ category: "unknown", confidence: 0, signals: [] }),
        makeML({
          category: "timeout",
          confidence: 0.85,
          signals: ["model:timeout"]
        }),
        makeML({
          category: "database",
          confidence: 0.8,
          signals: ["adaptive:database"]
        })
      )
      expect(result.category).toBe("database")
      expect(result.signals).toContain("adaptive:database")
    })
  })
})
