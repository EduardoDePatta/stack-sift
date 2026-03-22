import type { IncidentCategory } from "~/shared/types/incident"

export interface CategoryRule {
  category: IncidentCategory
  keywords: string[]
}

export const CATEGORY_RULES: CategoryRule[] = [
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
