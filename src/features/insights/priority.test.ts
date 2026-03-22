import { describe, expect, it } from "vitest"
import { computePriority } from "./computePriority"

describe("computePriority", () => {
  it("returns low for non-production environments", () => {
    expect(computePriority("timeout", "staging", null)).toBe("low")
    expect(computePriority("database", "development", null)).toBe("low")
    expect(computePriority("auth", "test", null)).toBe("low")
  })

  it("returns low when environment is null", () => {
    expect(computePriority("timeout", null, null)).toBe("low")
  })

  it("returns high for production + timeout", () => {
    expect(computePriority("timeout", "production", null)).toBe("high")
  })

  it("returns high for production + database", () => {
    expect(computePriority("database", "production", null)).toBe("high")
  })

  it("returns high for production + sensitive route (payment)", () => {
    expect(
      computePriority("runtime", "production", "/api/payment/process")
    ).toBe("high")
  })

  it("returns high for production + login route", () => {
    expect(
      computePriority("validation", "production", "/auth/login")
    ).toBe("high")
  })

  it("returns high for production + checkout route", () => {
    expect(
      computePriority("unknown", "production", "/checkout/confirm")
    ).toBe("high")
  })

  it("returns medium for production + non-sensitive route", () => {
    expect(
      computePriority("runtime", "production", "/dashboard")
    ).toBe("medium")
  })

  it("returns medium for production + null route + non-critical category", () => {
    expect(
      computePriority("validation", "production", null)
    ).toBe("medium")
  })

  it("treats 'prod' as production", () => {
    expect(computePriority("timeout", "prod", null)).toBe("high")
  })

  it("is case-insensitive for environment", () => {
    expect(computePriority("timeout", "Production", null)).toBe("high")
    expect(computePriority("timeout", "PRODUCTION", null)).toBe("high")
  })

  it("returns low for staging even with sensitive route", () => {
    expect(
      computePriority("auth", "staging", "/api/payment/process")
    ).toBe("low")
  })

  it("returns high when url tag contains sensitive pattern", () => {
    expect(
      computePriority("unknown", "production", "POST /check-email", "/v3/app/auth/check-email")
    ).toBe("high")
  })

  it("returns high from url even when route is not sensitive", () => {
    expect(
      computePriority("unknown", "production", "POST /validate", "/v3/app/billing/validate")
    ).toBe("high")
  })

  it("returns medium when neither route nor url is sensitive", () => {
    expect(
      computePriority("unknown", "production", "GET /api/data", "/v3/app/reports/list")
    ).toBe("medium")
  })
})
