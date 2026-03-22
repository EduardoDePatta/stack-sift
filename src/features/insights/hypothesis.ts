import type { IncidentCategory } from "~/shared/types/incident"

const HYPOTHESES: Record<IncidentCategory, string> = {
  timeout:
    "A downstream service or external dependency is responding too slowly or not at all. Check network connectivity, service health, and timeout configurations.",
  database:
    "A database operation failed. Check query correctness, connection pool health, schema migrations, and database server availability.",
  auth:
    "An authentication or authorization check failed. Verify token validity, expiration settings, permission rules, and identity provider health.",
  "runtime":
    "A runtime error occurred in client-side JavaScript. Check for null/undefined access, missing data guards, or incorrect type assumptions.",
  validation:
    "Input validation rejected a payload. Review the request shape, required fields, and any schema changes that may have introduced a mismatch.",
  integration:
    "A call to an external service or API failed. Check the upstream service status, request format, and network/firewall rules.",
  infra:
    "An infrastructure-level problem occurred. Check memory usage, disk space, container health, and resource limits.",
  unknown:
    "The error could not be automatically classified. Manual inspection of the stack trace and breadcrumbs is recommended."
}

export function buildHypothesis(category: IncidentCategory): string {
  return HYPOTHESES[category]
}
