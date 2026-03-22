import { describe, expect, it } from "vitest"
import { parseFrame } from "./frameParser/parseFrame"

describe("parseFrame", () => {
  describe("Sentry DOM format (filename in function)", () => {
    it("parses filename and function name", () => {
      const result = parseFrame(
        "/app/dist/src/services/Establishment.js in LegacyEstablishmentService"
      )
      expect(result).toEqual({
        filePath: "/app/dist/src/services/Establishment.js",
        line: null,
        column: null,
        fn: "LegacyEstablishmentService"
      })
    })

    it("parses with line number in filename", () => {
      const result = parseFrame(
        "/app/dist/src/services/Establishment.js:42:10 in LegacyEstablishmentService"
      )
      expect(result).toEqual({
        filePath: "/app/dist/src/services/Establishment.js",
        line: 42,
        column: 10,
        fn: "LegacyEstablishmentService"
      })
    })

    it("parses with 'at line' suffix", () => {
      const result = parseFrame(
        "/app/dist/src/services/Establishment.js in LegacyEstablishmentService at line 42"
      )
      expect(result).toEqual({
        filePath: "/app/dist/src/services/Establishment.js",
        line: 42,
        column: null,
        fn: "LegacyEstablishmentService"
      })
    })

    it("parses with 'at line' with column", () => {
      const result = parseFrame(
        "/app/dist/src/services/Establishment.js in query at line 42:10"
      )
      expect(result).toEqual({
        filePath: "/app/dist/src/services/Establishment.js",
        line: 42,
        column: 10,
        fn: "query"
      })
    })

    it("parses node_modules path", () => {
      const result = parseFrame(
        "/app/node_modules/typeorm/driver/postgres/PostgresQueryRunner.js in PostgresQueryRunner.query"
      )
      expect(result).toEqual({
        filePath:
          "/app/node_modules/typeorm/driver/postgres/PostgresQueryRunner.js",
        line: null,
        column: null,
        fn: "PostgresQueryRunner.query"
      })
    })

    it("parses node internal path", () => {
      const result = parseFrame(
        "node:internal/process/task_queues in process.processTicksAndRejections"
      )
      expect(result).toEqual({
        filePath: "node:internal/process/task_queues",
        line: null,
        column: null,
        fn: "process.processTicksAndRejections"
      })
    })
  })

  describe("JS at format", () => {
    it("parses standard at format with parens", () => {
      const result = parseFrame(
        "at UserService.find (src/services/user.ts:10:3)"
      )
      expect(result).toEqual({
        filePath: "src/services/user.ts",
        line: 10,
        column: 3,
        fn: "UserService.find"
      })
    })

    it("parses at format without function name", () => {
      const result = parseFrame(
        "at /app/dist/src/routes/index.js:45:12"
      )
      expect(result).toEqual({
        filePath: "/app/dist/src/routes/index.js",
        line: 45,
        column: 12,
        fn: null
      })
    })

    it("parses at format with line but no column", () => {
      const result = parseFrame(
        "at UserController.create (src/controllers/user.controller.ts:23)"
      )
      expect(result).toEqual({
        filePath: "src/controllers/user.controller.ts",
        line: 23,
        column: null,
        fn: "UserController.create"
      })
    })
  })

  describe("bare path", () => {
    it("parses bare filepath", () => {
      const result = parseFrame("src/services/order.ts")
      expect(result).toEqual({
        filePath: "src/services/order.ts",
        line: null,
        column: null,
        fn: null
      })
    })

    it("parses bare filepath with line", () => {
      const result = parseFrame("src/services/order.ts:42:5")
      expect(result).toEqual({
        filePath: "src/services/order.ts",
        line: 42,
        column: 5,
        fn: null
      })
    })
  })

  describe("edge cases", () => {
    it("returns null for empty string", () => {
      expect(parseFrame("")).toBeNull()
    })

    it("returns null for whitespace", () => {
      expect(parseFrame("   ")).toBeNull()
    })

    it("returns null for garbage text", () => {
      expect(parseFrame("some random text")).toBeNull()
    })

    it("trims whitespace", () => {
      const result = parseFrame(
        "  /app/dist/src/services/user.js in UserService  "
      )
      expect(result?.filePath).toBe("/app/dist/src/services/user.js")
      expect(result?.fn).toBe("UserService")
    })
  })
})
