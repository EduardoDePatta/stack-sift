import type { IncidentCategory } from "~/shared/types/incident"
import type { PatternRule } from "../patternRule"
import { AUTH_RULES } from "./authRules"
import { DATABASE_RULES } from "./databaseRules"
import { INFRA_RULES } from "./infraRules"
import { INTEGRATION_RULES } from "./integrationRules"
import { RUNTIME_RULES } from "./runtimeRules"
import { TIMEOUT_RULES } from "./timeoutRules"
import { VALIDATION_RULES } from "./validationRules"

export const RULES_BY_CATEGORY: Partial<Record<IncidentCategory, PatternRule[]>> = {
  database: DATABASE_RULES,
  validation: VALIDATION_RULES,
  timeout: TIMEOUT_RULES,
  auth: AUTH_RULES,
  "runtime": RUNTIME_RULES,
  integration: INTEGRATION_RULES,
  infra: INFRA_RULES
}
