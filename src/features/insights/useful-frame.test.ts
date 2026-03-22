import { describe, expect, it } from "vitest"
import { findAllUsefulFrames } from "./usefulFrame/findAllUsefulFrames"
import { findFirstUsefulFrame } from "./usefulFrame/findFirstUsefulFrame"

describe("findFirstUsefulFrame", () => {
  it("returns the first application frame", () => {
    const stack = [
      "at Object.<anonymous> (node_modules/express/lib/router.js:45:12)",
      "at UserController.create (src/controllers/user.controller.ts:23:5)",
      "at processTicksAndRejections (node:internal/process/task_queues:95:5)"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "at UserController.create (src/controllers/user.controller.ts:23:5)"
    )
  })

  it("skips vendor frames from node_modules", () => {
    const stack = [
      "at Module._compile (node_modules/ts-node/src/index.ts:1597:23)",
      "at PrismaClient._request (node_modules/.prisma/client/runtime/library.js:123)",
      "at OrderService.process (src/services/order.service.ts:42:10)"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "at OrderService.process (src/services/order.service.ts:42:10)"
    )
  })

  it("skips webpack internal frames", () => {
    const stack = [
      "at webpack://app/node_modules/react-dom/cjs/react-dom.production.min.js:123",
      "at Dashboard.render (src/components/Dashboard.tsx:15:3)"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "at Dashboard.render (src/components/Dashboard.tsx:15:3)"
    )
  })

  it("returns null for empty stack trace", () => {
    expect(findFirstUsefulFrame([])).toBeNull()
  })

  it("returns null when all frames are vendor frames", () => {
    const stack = [
      "at Object.<anonymous> (node_modules/express/lib/router.js:45:12)",
      "at processTicksAndRejections (node:internal/process/task_queues:95:5)"
    ]
    expect(findFirstUsefulFrame(stack)).toBeNull()
  })

  it("prefers frames with file extensions", () => {
    const stack = [
      "at eval (eval at <anonymous>)",
      "at handleRequest (src/api/handler.ts:10:5)"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "at handleRequest (src/api/handler.ts:10:5)"
    )
  })

  it("falls back to non-vendor frame without file extension", () => {
    const stack = [
      "at node_modules/some-lib/index.js:1:1",
      "at myFunction (somewhere:12:5)"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "at myFunction (somewhere:12:5)"
    )
  })

  it("skips blank lines", () => {
    const stack = [
      "",
      "  ",
      "at UserService.find (src/services/user.service.ts:8:3)"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "at UserService.find (src/services/user.service.ts:8:3)"
    )
  })

  it("skips error handler frames and picks the caller", () => {
    const stack = [
      "/app/dist/src/adapters/v3/handleV3Error.js in handleV3Error at line 13:15",
      "/app/dist/src/controllers/v3/AuthController.js in <anonymous> at line 37:52",
      "/app/dist/src/controllers/v3/AuthController.js in rejected at line 6:65"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "/app/dist/src/controllers/v3/AuthController.js in <anonymous> at line 37:52"
    )
  })

  it("skips generic handleError function", () => {
    const stack = [
      "at handleError (src/utils/error-handler.ts:15:3)",
      "at PaymentService.charge (src/services/payment.service.ts:88:5)"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "at PaymentService.charge (src/services/payment.service.ts:88:5)"
    )
  })

  it("skips throwError utility", () => {
    const stack = [
      "at throwError (src/helpers/throw-error.ts:5:3)",
      "at OrderController.create (src/controllers/order.controller.ts:22:7)"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "at OrderController.create (src/controllers/order.controller.ts:22:7)"
    )
  })

  it("skips async boilerplate (rejected/fulfilled)", () => {
    const stack = [
      "/app/dist/src/controllers/v3/AuthController.js in rejected at line 6:65"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "/app/dist/src/controllers/v3/AuthController.js in rejected at line 6:65"
    )
  })

  it("falls back to last useful frame when all are handlers or boilerplate", () => {
    const stack = [
      "/app/dist/src/adapters/v3/handleV3Error.js in handleV3Error at line 13:15",
      "/app/dist/src/controllers/v3/AuthController.js in rejected at line 6:65"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "/app/dist/src/controllers/v3/AuthController.js in rejected at line 6:65"
    )
  })

  it("handles real Sentry stack: handleV3Error → AuthController → rejected", () => {
    const stack = [
      "/app/dist/src/adapters/v3/handleV3Error.js in handleV3Error at line 13:15",
      "/app/dist/src/controllers/v3/AuthController.js in <anonymous> at line 37:52",
      "/app/dist/src/controllers/v3/AuthController.js in rejected at line 6:65",
      "node:internal/process/task_queues in process.processTicksAndRejections"
    ]
    expect(findFirstUsefulFrame(stack)).toBe(
      "/app/dist/src/controllers/v3/AuthController.js in <anonymous> at line 37:52"
    )
  })
})

describe("findAllUsefulFrames", () => {
  it("returns all non-vendor code frames", () => {
    const stack = [
      "/app/dist/src/adapters/v3/handleV3Error.js in handleV3Error at line 13:15",
      "/app/dist/src/controllers/v3/AuthController.js in <anonymous> at line 37:52",
      "/app/dist/src/controllers/v3/AuthController.js in rejected at line 6:65",
      "node:internal/process/task_queues in process.processTicksAndRejections"
    ]
    const frames = findAllUsefulFrames(stack)
    expect(frames).toHaveLength(3)
    expect(frames[0]).toContain("handleV3Error")
    expect(frames[1]).toContain("AuthController")
    expect(frames[2]).toContain("rejected")
  })

  it("excludes vendor frames", () => {
    const stack = [
      "at PrismaClient._request (node_modules/.prisma/client/runtime/library.js:123)",
      "at OrderService.process (src/services/order.service.ts:42:10)",
      "at processTicksAndRejections (node:internal/process/task_queues:95:5)"
    ]
    const frames = findAllUsefulFrames(stack)
    expect(frames).toHaveLength(1)
    expect(frames[0]).toContain("OrderService")
  })

  it("returns empty for all vendor frames", () => {
    const stack = [
      "at Object.<anonymous> (node_modules/express/lib/router.js:45:12)",
      "at processTicksAndRejections (node:internal/process/task_queues:95:5)"
    ]
    expect(findAllUsefulFrames(stack)).toEqual([])
  })

  it("returns empty for empty stack", () => {
    expect(findAllUsefulFrames([])).toEqual([])
  })
})
