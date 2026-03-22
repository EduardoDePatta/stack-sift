const SENTRY_ISSUE_PATTERNS = [
  /^https?:\/\/[^/]+\.sentry\.io\/issues\/\d+/,
  /^https?:\/\/[^/]+\.sentry\.io\/organizations\/[^/]+\/issues\/\d+/,
  /^https?:\/\/sentry\.io\/organizations\/[^/]+\/issues\/\d+/
]

export function isSentryIssuePage(url: string): boolean {
  return SENTRY_ISSUE_PATTERNS.some((pattern) => pattern.test(url))
}
