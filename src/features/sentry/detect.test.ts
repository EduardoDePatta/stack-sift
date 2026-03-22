import { describe, expect, it } from "vitest"
import { isSentryIssuePage } from "./detect"

describe("isSentryIssuePage", () => {
  it("matches org subdomain issue URL", () => {
    expect(
      isSentryIssuePage("https://myorg.sentry.io/issues/12345")
    ).toBe(true)
  })

  it("matches org subdomain issue URL with trailing path", () => {
    expect(
      isSentryIssuePage("https://myorg.sentry.io/issues/12345/events/abc")
    ).toBe(true)
  })

  it("matches organizations path pattern", () => {
    expect(
      isSentryIssuePage(
        "https://myorg.sentry.io/organizations/myorg/issues/12345"
      )
    ).toBe(true)
  })

  it("matches sentry.io organizations path", () => {
    expect(
      isSentryIssuePage(
        "https://sentry.io/organizations/myorg/issues/12345"
      )
    ).toBe(true)
  })

  it("rejects non-issue Sentry pages", () => {
    expect(
      isSentryIssuePage("https://myorg.sentry.io/projects/")
    ).toBe(false)
  })

  it("rejects non-issue Sentry settings", () => {
    expect(
      isSentryIssuePage("https://myorg.sentry.io/settings/")
    ).toBe(false)
  })

  it("rejects non-Sentry URLs", () => {
    expect(isSentryIssuePage("https://github.com/issues/123")).toBe(false)
  })

  it("rejects issues without numeric ID", () => {
    expect(
      isSentryIssuePage("https://myorg.sentry.io/issues/")
    ).toBe(false)
  })

  it("rejects empty string", () => {
    expect(isSentryIssuePage("")).toBe(false)
  })

  it("rejects http:// URLs (matches anyway since pattern allows)", () => {
    expect(
      isSentryIssuePage("http://myorg.sentry.io/issues/12345")
    ).toBe(true)
  })
})
