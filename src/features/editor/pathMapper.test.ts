import { describe, expect, it } from "vitest"
import { mapToSourcePath } from "./pathMapper/mapToSourcePath"

describe("mapToSourcePath", () => {
  describe("strips build prefixes", () => {
    it("strips /app/dist/ prefix", () => {
      expect(mapToSourcePath("/app/dist/src/services/user.js")).toBe(
        "src/services/user.ts"
      )
    })

    it("strips /app/build/ prefix", () => {
      expect(mapToSourcePath("/app/build/src/controllers/auth.js")).toBe(
        "src/controllers/auth.ts"
      )
    })

    it("strips /app/.next/server/ prefix", () => {
      expect(
        mapToSourcePath("/app/.next/server/pages/api/webhook.js")
      ).toBe("pages/api/webhook.ts")
    })

    it("strips /var/task/ prefix (AWS Lambda)", () => {
      expect(mapToSourcePath("/var/task/src/handler.js")).toBe(
        "src/handler.ts"
      )
    })

    it("strips app/dist/ without leading slash", () => {
      expect(mapToSourcePath("app/dist/src/utils/date.js")).toBe(
        "src/utils/date.ts"
      )
    })
  })

  describe("maps extensions", () => {
    it("maps .js to .ts", () => {
      expect(mapToSourcePath("src/services/user.js")).toBe(
        "src/services/user.ts"
      )
    })

    it("maps .jsx to .tsx", () => {
      expect(mapToSourcePath("src/components/Button.jsx")).toBe(
        "src/components/Button.tsx"
      )
    })

    it("maps .mjs to .mts", () => {
      expect(mapToSourcePath("src/config.mjs")).toBe("src/config.mts")
    })

    it("preserves .ts extension", () => {
      expect(mapToSourcePath("src/services/user.ts")).toBe(
        "src/services/user.ts"
      )
    })

    it("preserves .tsx extension", () => {
      expect(mapToSourcePath("src/components/App.tsx")).toBe(
        "src/components/App.tsx"
      )
    })
  })

  describe("combined prefix + extension", () => {
    it("strips prefix and maps extension", () => {
      expect(
        mapToSourcePath(
          "/app/dist/src/features/auth/middleware.js"
        )
      ).toBe("src/features/auth/middleware.ts")
    })

    it("handles deeply nested paths", () => {
      expect(
        mapToSourcePath(
          "/app/dist/src/modules/billing/services/invoice/InvoiceService.js"
        )
      ).toBe("src/modules/billing/services/invoice/InvoiceService.ts")
    })
  })

  describe("no-op paths", () => {
    it("returns path as-is when no prefix matches", () => {
      expect(mapToSourcePath("src/services/user.ts")).toBe(
        "src/services/user.ts"
      )
    })

    it("handles node_modules paths (no extension mapping useful)", () => {
      expect(
        mapToSourcePath("node_modules/express/lib/router.js")
      ).toBe("node_modules/express/lib/router.ts")
    })
  })
})
