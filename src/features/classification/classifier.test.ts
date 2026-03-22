import { describe, expect, it } from "vitest"
import type { ParsedIncident } from "~/shared/types/incident"
import { classifyIncident } from "./classifyIncident"

function makeIncident(overrides: Partial<ParsedIncident> = {}): ParsedIncident {
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

describe("classifyIncident", () => {
  it("classifies timeout errors", () => {
    const result = classifyIncident(
      makeIncident({ title: "Error: ETIMEDOUT - request timed out" })
    )
    expect(result.category).toBe("timeout")
    expect(result.signals).toContain("etimedout")
    expect(result.confidence).toBeGreaterThan(0)
  })

  it("classifies database errors", () => {
    const result = classifyIncident(
      makeIncident({ title: "PrismaClientKnownRequestError: Query failed" })
    )
    expect(result.category).toBe("database")
    expect(result.signals).toContain("prisma")
    expect(result.signals).toContain("query failed")
  })

  it("classifies database errors from QueryFailedError", () => {
    const result = classifyIncident(
      makeIncident({
        title:
          'QueryFailedError: duplicate key value violates unique constraint "PK_abc"'
      })
    )
    expect(result.category).toBe("database")
    expect(result.signals).toContain("queryfailederror")
    expect(result.signals).toContain("duplicate key")
  })

  it("classifies database errors from typeorm in stack trace", () => {
    const result = classifyIncident(
      makeIncident({
        title: "Internal Server Error",
        stackTrace: [
          "/app/node_modules/typeorm/driver/postgres/PostgresQueryRunner.js in query",
          "node:internal/process/task_queues in process.processTicksAndRejections"
        ]
      })
    )
    expect(result.category).toBe("database")
    expect(result.signals).toContain("typeorm")
  })

  it("classifies auth errors", () => {
    const result = classifyIncident(
      makeIncident({ title: "Error: Unauthorized - JWT token expired" })
    )
    expect(result.category).toBe("auth")
    expect(result.signals).toContain("unauthorized")
    expect(result.signals).toContain("jwt")
    expect(result.signals).toContain("token expired")
  })

  it("classifies auth errors from access denied", () => {
    const result = classifyIncident(
      makeIncident({ title: "Error: Access denied for this resource" })
    )
    expect(result.category).toBe("auth")
    expect(result.signals).toContain("access denied")
  })

  it("classifies runtime errors", () => {
    const result = classifyIncident(
      makeIncident({
        title: "TypeError: Cannot read properties of undefined (reading 'map')"
      })
    )
    expect(result.category).toBe("runtime")
    expect(result.signals).toContain("cannot read properties of undefined")
    expect(result.signals).toContain("typeerror")
  })

  it("classifies validation errors", () => {
    const result = classifyIncident(
      makeIncident({ title: "ZodError: Validation failed for schema" })
    )
    expect(result.category).toBe("validation")
    expect(result.signals).toContain("zod")
    expect(result.signals).toContain("validation")
    expect(result.signals).toContain("schema")
  })

  it("classifies validation errors from bad request", () => {
    const result = classifyIncident(
      makeIncident({ title: "Error: Bad request - missing field 'email'" })
    )
    expect(result.category).toBe("validation")
    expect(result.signals).toContain("bad request")
    expect(result.signals).toContain("missing field")
  })

  it("classifies integration errors", () => {
    const result = classifyIncident(
      makeIncident({ title: "AxiosError: Request failed with status 502" })
    )
    expect(result.category).toBe("integration")
    expect(result.signals).toContain("axios")
    expect(result.signals).toContain("502")
  })

  it("classifies infra errors", () => {
    const result = classifyIncident(
      makeIncident({
        title: "Error: JavaScript heap out of memory"
      })
    )
    expect(result.category).toBe("infra")
    expect(result.signals).toContain("out of memory")
    expect(result.signals).toContain("heap")
  })

  it("returns unknown for unrecognizable errors", () => {
    const result = classifyIncident(
      makeIncident({ title: "Something completely unexpected happened" })
    )
    expect(result.category).toBe("unknown")
    expect(result.confidence).toBe(0)
    expect(result.signals).toEqual([])
  })

  it("returns unknown for business logic errors", () => {
    const result = classifyIncident(
      makeIncident({
        title: "Error: E-mail não encontrado",
        stackTrace: [
          "/app/dist/src/adapters/v3/handleV3Error.js in handleV3Error",
          "/app/dist/src/controllers/v3/AuthController.js in <anonymous>"
        ]
      })
    )
    expect(result.category).toBe("unknown")
  })

  it("searches stack trace in addition to title", () => {
    const result = classifyIncident(
      makeIncident({
        title: "Internal Server Error",
        stackTrace: [
          "at PrismaClient._request (node_modules/.prisma/client/runtime/library.js:123)",
          "at processTicksAndRejections (node:internal/process/task_queues:95:5)",
          "SQL query failed: duplicate key constraint"
        ]
      })
    )
    expect(result.category).toBe("database")
    expect(result.signals).toContain("prisma")
    expect(result.signals).toContain("sql")
    expect(result.signals).toContain("query failed")
    expect(result.signals).toContain("duplicate key")
  })

  it("picks the category with the most signal matches", () => {
    const result = classifyIncident(
      makeIncident({
        title: "Error: timeout while connecting to database",
        stackTrace: ["PrismaClient query failed", "SQL connection refused"]
      })
    )
    expect(result.category).toBe("database")
  })

  it("computes confidence capped at 1", () => {
    const result = classifyIncident(
      makeIncident({
        title:
          "PrismaClientKnownRequestError: SQL query failed, database connection refused, duplicate key"
      })
    )
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(result.confidence).toBeGreaterThan(0)
  })

  it("is case-insensitive", () => {
    const result = classifyIncident(
      makeIncident({ title: "TYPEERROR: Cannot Read Properties Of Undefined" })
    )
    expect(result.category).toBe("runtime")
  })

  it("does not use route to determine category", () => {
    const result = classifyIncident(
      makeIncident({
        title: "Error: ETIMEDOUT",
        route: "/api/auth/login"
      })
    )
    expect(result.category).toBe("timeout")
  })

  it("does not use tags to determine category", () => {
    const result = classifyIncident(
      makeIncident({
        title: "Error: ETIMEDOUT",
        tags: { url: "/v3/app/auth/check-email" }
      })
    )
    expect(result.category).toBe("timeout")
  })
})
