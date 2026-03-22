import type {
  ClassificationResult,
  IncidentCategory,
  ParsedIncident
} from "~/shared/types/incident"

interface CategoryRule {
  category: IncidentCategory
  keywords: string[]
}

const RULES: CategoryRule[] = [
  {
    category: "timeout",
    keywords: [
      "timeout",
      "etimedout",
      "socket hang up",
      "econnaborted",
      "request timed out",
      "deadline exceeded",
      "operation timed out"
    ]
  },
  {
    category: "database",
    keywords: [
      "prisma",
      "sql",
      "query failed",
      "database",
      "pg_",
      "relation does not exist",
      "duplicate key",
      "deadlock",
      "connection refused",
      "queryfailederror",
      "sequelize",
      "typeorm"
    ]
  },
  {
    category: "auth",
    keywords: [
      "unauthorized",
      "forbidden",
      "jwt",
      "token expired",
      "token invalid",
      "authentication",
      "unauthenticated",
      "403",
      "401",
      "credential",
      "password",
      "access denied",
      "permission denied"
    ]
  },
  {
    category: "runtime",
    keywords: [
      "cannot read properties of undefined",
      "cannot read properties of null",
      "is not a function",
      "is not defined",
      "undefined is not an object",
      "null is not an object",
      "typeerror",
      "referenceerror"
    ]
  },
  {
    category: "validation",
    keywords: [
      "validation",
      "schema",
      "invalid payload",
      "zod",
      "invalid input",
      "expected string",
      "required field",
      "parse error",
      "bad request",
      "400",
      "missing field",
      "invalid email",
      "invalid format"
    ]
  },
  {
    category: "integration",
    keywords: [
      "axios",
      "fetch failed",
      "gateway",
      "upstream",
      "econnrefused",
      "network error",
      "502",
      "503",
      "504",
      "service unavailable"
    ]
  },
  {
    category: "infra",
    keywords: [
      "out of memory",
      "oom",
      "disk full",
      "enospc",
      "segfault",
      "container",
      "kubernetes",
      "pod",
      "heap"
    ]
  }
]

function buildSearchText(incident: ParsedIncident): string {
  return [incident.title, ...incident.stackTrace].join("\n").toLowerCase()
}

function matchCategory(
  searchText: string,
  rule: CategoryRule
): string[] {
  return rule.keywords.filter((kw) => searchText.includes(kw))
}

export function classifyIncident(
  incident: ParsedIncident
): ClassificationResult {
  const searchText = buildSearchText(incident)

  let bestCategory: IncidentCategory = "unknown"
  let bestSignals: string[] = []
  let bestScore = 0

  for (const rule of RULES) {
    const matched = matchCategory(searchText, rule)
    if (matched.length > bestScore) {
      bestScore = matched.length
      bestCategory = rule.category
      bestSignals = matched
    }
  }

  const confidence =
    bestScore === 0 ? 0 : Math.min(bestScore / 3, 1)

  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    signals: bestSignals
  }
}
