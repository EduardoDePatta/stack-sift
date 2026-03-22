import { describe, expect, it } from "vitest"
import {
  tokenize,
  buildTermFrequency,
  cosineSimilarity,
  textSimilarity
} from "./textSimilarity"

describe("tokenize", () => {
  it("lowercases and splits on non-alphanum", () => {
    const tokens = tokenize("QueryFailedError: duplicate KEY")
    expect(tokens).toContain("queryfailederror:")
    expect(tokens).toContain("duplicate")
    expect(tokens).toContain("key")
  })

  it("removes stop words", () => {
    const tokens = tokenize("the error is not defined in the scope")
    expect(tokens).not.toContain("the")
    expect(tokens).not.toContain("is")
    expect(tokens).not.toContain("in")
    expect(tokens).toContain("error")
    expect(tokens).toContain("defined")
    expect(tokens).toContain("scope")
  })

  it("removes single-char tokens", () => {
    const tokens = tokenize("a b c error")
    expect(tokens).toEqual(["error"])
  })

  it("preserves file paths and technical terms", () => {
    const tokens = tokenize(
      "/app/dist/src/services/Establishment.js in query"
    )
    expect(tokens).toContain("/app/dist/src/services/establishment.js")
    expect(tokens).toContain("query")
  })
})

describe("buildTermFrequency", () => {
  it("counts token frequencies", () => {
    const tf = buildTermFrequency(["error", "error", "timeout"])
    expect(tf.get("error")).toBe(2)
    expect(tf.get("timeout")).toBe(1)
  })
})

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const tf = buildTermFrequency(["error", "timeout"])
    expect(cosineSimilarity(tf, tf)).toBeCloseTo(1, 5)
  })

  it("returns 0 for orthogonal vectors", () => {
    const a = buildTermFrequency(["error", "timeout"])
    const b = buildTermFrequency(["database", "prisma"])
    expect(cosineSimilarity(a, b)).toBe(0)
  })

  it("returns value between 0 and 1 for partial overlap", () => {
    const a = buildTermFrequency(["error", "timeout", "connection"])
    const b = buildTermFrequency(["error", "database", "connection"])
    const sim = cosineSimilarity(a, b)
    expect(sim).toBeGreaterThan(0)
    expect(sim).toBeLessThan(1)
  })

  it("returns 0 when either vector is empty", () => {
    const empty = new Map<string, number>()
    const a = buildTermFrequency(["error"])
    expect(cosineSimilarity(empty, a)).toBe(0)
    expect(cosineSimilarity(a, empty)).toBe(0)
  })
})

describe("textSimilarity", () => {
  it("returns high similarity for similar error messages", () => {
    const a =
      "QueryFailedError: duplicate key value violates unique constraint"
    const b =
      "QueryFailedError: duplicate key value violates unique constraint PK_abc"
    expect(textSimilarity(a, b)).toBeGreaterThan(0.8)
  })

  it("returns low similarity for unrelated errors", () => {
    const a = "Cannot read properties of undefined"
    const b = "ETIMEDOUT connecting to redis"
    expect(textSimilarity(a, b)).toBeLessThan(0.2)
  })

  it("returns moderate similarity for same-category errors", () => {
    const a =
      "QueryFailedError: duplicate key violates constraint\n/app/node_modules/typeorm/PostgresQueryRunner.js"
    const b =
      "QueryFailedError: deadlock detected\n/app/node_modules/typeorm/PostgresQueryRunner.js"
    const sim = textSimilarity(a, b)
    expect(sim).toBeGreaterThan(0.3)
    expect(sim).toBeLessThan(0.9)
  })

  it("returns 0 for empty text", () => {
    expect(textSimilarity("", "error")).toBe(0)
    expect(textSimilarity("error", "")).toBe(0)
  })

  it("recognizes similar stack traces", () => {
    const a =
      "TypeError: Cannot read properties of undefined\n/app/dist/src/services/Establishment.js in LegacyEstablishmentService"
    const b =
      "TypeError: Cannot read properties of undefined\n/app/dist/src/services/Establishment.js in getOpenTimes"
    expect(textSimilarity(a, b)).toBeGreaterThan(0.7)
  })
})
