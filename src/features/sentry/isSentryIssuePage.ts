import { SENTRY_ISSUE_PATTERNS } from "./data/sentryIssuePatterns"

export function isSentryIssuePage(url: string): boolean {
  return SENTRY_ISSUE_PATTERNS.some((pattern) => pattern.test(url))
}
