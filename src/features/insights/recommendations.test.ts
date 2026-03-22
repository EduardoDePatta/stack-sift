import { describe, expect, it } from "vitest"
import type { ParsedIncident } from "~/shared/types/incident"
import { buildRecommendations } from "./recommendations/buildRecommendations"

function makeIncident(
  overrides: Partial<ParsedIncident> = {}
): ParsedIncident {
  return {
    title: "",
    stackTrace: [],
    breadcrumbs: [],
    environment: null,
    release: null,
    route: null,
    tags: {},
    ...overrides
  }
}

describe("buildRecommendations", () => {
  describe("database", () => {
    it("detects duplicate key", () => {
      const incident = makeIncident({
        title: 'duplicate key value violates unique constraint "PK_abc"'
      })
      const recs = buildRecommendations(incident, "database")
      expect(recs.length).toBeGreaterThan(0)
      expect(recs[0].text).toContain("upsert")
    })

    it("detects deadlock", () => {
      const incident = makeIncident({
        title: "deadlock detected"
      })
      const recs = buildRecommendations(incident, "database")
      expect(recs[0].text).toContain("locks")
    })

    it("detects connection refused", () => {
      const incident = makeIncident({
        title: "connection refused to database"
      })
      const recs = buildRecommendations(incident, "database")
      expect(recs[0].text).toContain("connection pool")
    })

    it("detects relation does not exist", () => {
      const incident = makeIncident({
        title: 'relation "users" does not exist'
      })
      const recs = buildRecommendations(incident, "database")
      expect(recs[0].text).toContain("migrations")
    })

    it("detects typeorm + queryfailederror", () => {
      const incident = makeIncident({
        title: "QueryFailedError",
        stackTrace: [
          "node_modules/typeorm/driver/postgres/PostgresQueryRunner.js in query"
        ]
      })
      const recs = buildRecommendations(incident, "database")
      const typeormRec = recs.find((r) => r.text.includes("TypeORM"))
      expect(typeormRec).toBeDefined()
    })

    it("detects prisma", () => {
      const incident = makeIncident({
        stackTrace: ["node_modules/.prisma/client/runtime/library.js"]
      })
      const recs = buildRecommendations(incident, "database")
      expect(recs[0].text).toContain("Prisma")
    })
  })

  describe("validation", () => {
    it("detects unprocessable entity", () => {
      const incident = makeIncident({
        title: "Unprocessable entity"
      })
      const recs = buildRecommendations(incident, "validation")
      expect(recs[0].text).toContain("class-validator")
    })

    it("detects zod errors", () => {
      const incident = makeIncident({
        title: "ZodError: invalid_type",
        stackTrace: ["node_modules/zod/lib/types.js"]
      })
      const recs = buildRecommendations(incident, "validation")
      const zodRec = recs.find((r) => r.text.includes("Zod"))
      expect(zodRec).toBeDefined()
    })

    it("detects bad request", () => {
      const incident = makeIncident({
        title: "Bad Request"
      })
      const recs = buildRecommendations(incident, "validation")
      expect(recs[0].text).toContain("400")
    })

    it("detects missing field", () => {
      const incident = makeIncident({
        title: "missing field: email"
      })
      const recs = buildRecommendations(incident, "validation")
      expect(recs[0].text).toContain("obrigatórios")
    })
  })

  describe("timeout", () => {
    it("detects ETIMEDOUT", () => {
      const incident = makeIncident({
        title: "connect ETIMEDOUT 10.0.0.1:5432"
      })
      const recs = buildRecommendations(incident, "timeout")
      expect(recs[0].text).toContain("DNS")
    })

    it("detects socket hang up", () => {
      const incident = makeIncident({
        title: "socket hang up"
      })
      const recs = buildRecommendations(incident, "timeout")
      expect(recs[0].text).toContain("cortada")
    })

    it("detects deadline exceeded", () => {
      const incident = makeIncident({
        title: "DEADLINE_EXCEEDED: deadline exceeded"
      })
      const recs = buildRecommendations(incident, "timeout")
      expect(recs[0].text).toContain("gRPC")
    })

    it("detects ECONNREFUSED", () => {
      const incident = makeIncident({
        title: "connect ECONNREFUSED 127.0.0.1:6379"
      })
      const recs = buildRecommendations(incident, "timeout")
      expect(recs[0].text).toContain("porta")
    })
  })

  describe("auth", () => {
    it("detects token expired", () => {
      const incident = makeIncident({
        title: "TokenExpiredError: jwt expired"
      })
      const recs = buildRecommendations(incident, "auth")
      expect(recs[0].text).toContain("TTL")
    })

    it("detects invalid token", () => {
      const incident = makeIncident({
        title: "JsonWebTokenError: invalid token"
      })
      const recs = buildRecommendations(incident, "auth")
      expect(recs[0].text).toContain("assinatura")
    })

    it("detects 403 forbidden", () => {
      const incident = makeIncident({
        title: "Forbidden"
      })
      const recs = buildRecommendations(incident, "auth")
      expect(recs[0].text).toContain("403")
    })

    it("detects 401 unauthorized", () => {
      const incident = makeIncident({
        title: "Unauthorized"
      })
      const recs = buildRecommendations(incident, "auth")
      expect(recs[0].text).toContain("401")
    })
  })

  describe("runtime", () => {
    it("detects cannot read properties of undefined", () => {
      const incident = makeIncident({
        title: "TypeError: Cannot read properties of undefined (reading 'map')"
      })
      const recs = buildRecommendations(incident, "runtime")
      expect(recs[0].text).toContain("optional chaining")
    })

    it("detects is not a function", () => {
      const incident = makeIncident({
        title: "TypeError: foo.bar is not a function"
      })
      const recs = buildRecommendations(incident, "runtime")
      expect(recs[0].text).toContain("imports")
    })

    it("detects maximum call stack", () => {
      const incident = makeIncident({
        title: "RangeError: Maximum call stack size exceeded"
      })
      const recs = buildRecommendations(incident, "runtime")
      expect(recs[0].text).toContain("recursão")
    })

    it("detects chunk loading failure", () => {
      const incident = makeIncident({
        title: "Loading chunk 42 failed"
      })
      const recs = buildRecommendations(incident, "runtime")
      expect(recs[0].text).toContain("chunk")
    })
  })

  describe("integration", () => {
    it("detects ENOTFOUND", () => {
      const incident = makeIncident({
        title: "getaddrinfo ENOTFOUND api.stripe.com"
      })
      const recs = buildRecommendations(incident, "integration")
      expect(recs[0].text).toContain("DNS")
    })

    it("detects 502 bad gateway", () => {
      const incident = makeIncident({
        title: "502 Bad Gateway"
      })
      const recs = buildRecommendations(incident, "integration")
      expect(recs[0].text).toContain("upstream")
    })

    it("detects rate limit 429", () => {
      const incident = makeIncident({
        title: "Request failed with status code 429"
      })
      const recs = buildRecommendations(incident, "integration")
      expect(recs[0].text).toContain("429")
    })

    it("detects CORS error", () => {
      const incident = makeIncident({
        title: "CORS policy: No 'Access-Control-Allow-Origin'"
      })
      const recs = buildRecommendations(incident, "integration")
      expect(recs[0].text).toContain("CORS")
    })
  })

  describe("infra", () => {
    it("detects heap out of memory", () => {
      const incident = makeIncident({
        title: "FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory"
      })
      const recs = buildRecommendations(incident, "infra")
      expect(recs[0].text).toContain("max-old-space-size")
    })

    it("detects disk full ENOSPC", () => {
      const incident = makeIncident({
        title: "ENOSPC: no space left on device"
      })
      const recs = buildRecommendations(incident, "infra")
      expect(recs[0].text).toContain("Disco")
    })

    it("detects OOM killed", () => {
      const incident = makeIncident({
        title: "Process was killed by OOM killer"
      })
      const recs = buildRecommendations(incident, "infra")
      expect(recs[0].text).toContain("OOM")
    })
  })

  describe("fallback", () => {
    it("returns generic hypothesis when no pattern matches", () => {
      const incident = makeIncident({
        title: "Something completely unknown happened"
      })
      const recs = buildRecommendations(incident, "unknown")
      expect(recs.length).toBe(1)
      expect(recs[0].specificity).toBe(0)
      expect(recs[0].text).toContain("could not be automatically classified")
    })

    it("returns generic hypothesis for category with no matching patterns", () => {
      const incident = makeIncident({
        title: "Some weird database thing"
      })
      const recs = buildRecommendations(incident, "database")
      expect(recs.length).toBe(1)
      expect(recs[0].specificity).toBe(0)
      expect(recs[0].text).toContain("database operation failed")
    })
  })

  describe("cross-category detection", () => {
    it("picks up patterns from other categories with lower specificity", () => {
      const incident = makeIncident({
        title: "ETIMEDOUT connecting to database"
      })
      const recs = buildRecommendations(incident, "database")
      const timeoutRec = recs.find((r) => r.text.includes("DNS"))
      expect(timeoutRec).toBeDefined()
      expect(timeoutRec!.specificity).toBeLessThan(0.9)
    })
  })

  describe("ordering and limits", () => {
    it("sorts by specificity descending", () => {
      const incident = makeIncident({
        title: "QueryFailedError: duplicate key value violates unique constraint",
        stackTrace: [
          "node_modules/typeorm/driver/postgres/PostgresQueryRunner.js"
        ]
      })
      const recs = buildRecommendations(incident, "database")
      for (let i = 1; i < recs.length; i++) {
        expect(recs[i].specificity).toBeLessThanOrEqual(
          recs[i - 1].specificity
        )
      }
    })

    it("returns at most 5 recommendations", () => {
      const incident = makeIncident({
        title: "ETIMEDOUT socket hang up econnaborted deadline exceeded econnrefused request timed out"
      })
      const recs = buildRecommendations(incident, "timeout")
      expect(recs.length).toBeLessThanOrEqual(5)
    })

    it("deduplicates recommendations", () => {
      const incident = makeIncident({
        title: "duplicate key error",
        breadcrumbs: ["duplicate key violation"]
      })
      const recs = buildRecommendations(incident, "database")
      const texts = recs.map((r) => r.text)
      expect(new Set(texts).size).toBe(texts.length)
    })
  })
})
