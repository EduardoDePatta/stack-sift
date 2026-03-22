import type { ParsedIncident } from "~/shared/types/incident"
import type { MLFeatures } from "./types"

// ---------- keyword lists (existing) ----------

const TIMEOUT_TERMS = [
  "timeout", "etimedout", "socket hang up", "econnaborted",
  "request timed out", "deadline exceeded"
]

const DATABASE_TERMS = [
  "prisma", "sql", "query failed", "database", "duplicate key",
  "deadlock", "queryfailederror", "sequelize", "typeorm"
]

const AUTH_TERMS = [
  "unauthorized", "forbidden", "jwt", "token expired",
  "authentication", "unauthenticated", "access denied",
  "permission denied", "credential", "password", "401", "403"
]

const RUNTIME_ERROR_TERMS = [
  "cannot read properties of undefined", "cannot read properties of null",
  "is not a function", "is not defined", "typeerror", "referenceerror"
]

const VALIDATION_TERMS = [
  "validation", "schema", "invalid payload", "zod",
  "invalid input", "parse error", "bad request", "400"
]

const INTEGRATION_TERMS = [
  "enotfound", "502", "503", "bad gateway",
  "service unavailable", "rate limit", "cors", "ssl", "certificate"
]

const INFRA_TERMS = [
  "enomem", "out of memory", "enospc", "no space left",
  "killed", "oom", "segmentation fault", "sigsegv"
]

const CRITICAL_ROUTE_PATTERNS = [
  "payment", "checkout", "login", "auth",
  "signup", "register", "billing", "subscription"
]

// ---------- stack detection lists ----------

const ORM_LIBS = [
  "typeorm", "prisma", "sequelize", "mongoose", "knex",
  "mikro-orm", "objection", "bookshelf", "drizzle"
]

const DB_DRIVERS = [
  "/pg/", "pg-pool", "mysql2", "mongodb", "redis", "ioredis",
  "better-sqlite3", "mssql", "cassandra-driver", "oracledb"
]

const HTTP_CLIENTS = [
  "axios", "/got/", "node-fetch", "undici", "superagent",
  "/request/", "bent", "/ky/"
]

const QUEUE_LIBS = [
  "bull", "bullmq", "amqplib", "kafkajs", "sqs",
  "bee-queue", "agenda"
]

const AUTH_LIBS = [
  "passport", "jsonwebtoken", "bcrypt", "/jose/",
  "oauth", "openid"
]

const FRAMEWORKS = [
  "express", "fastify", "/koa/", "nestjs", "@nestjs",
  "hapi", "adonis", "restify"
]

const VALIDATORS = [
  "/zod/", "/joi/", "/yup/", "class-validator", "/ajv/",
  "io-ts", "superstruct", "valibot"
]

const NATIVE_ERRORS = [
  "typeerror", "rangeerror", "syntaxerror", "referenceerror",
  "evalerror", "urierror", "error"
]

const VENDOR_PATTERNS = [
  "node_modules", "webpack", "react-dom", "@babel",
  "regenerator-runtime", "core-js", "tslib",
  "internal/process", "node:internal", "native code"
]

// ---------- helpers ----------

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t))
}

function containsAnyInLines(lines: string[], terms: string[]): boolean {
  const joined = lines.join("\n").toLowerCase()
  return terms.some((t) => joined.includes(t))
}

function isVendorFrame(frame: string): boolean {
  const lower = frame.toLowerCase()
  return VENDOR_PATTERNS.some((p) => lower.includes(p))
}

function extractErrorClass(title: string): string {
  const match = title.match(/^([A-Z][a-zA-Z]*Error)/)
  return match ? match[1].toLowerCase() : ""
}

function extractHTTPMethod(route: string | null): string | null {
  if (!route) return null
  const match = route.match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/i)
  return match ? match[1].toUpperCase() : null
}

function countRouteSegments(route: string | null): number {
  if (!route) return 0
  const path = route.replace(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+/i, "")
  return path.split("/").filter((s) => s.length > 0).length
}

function extractLastHTTPStatus(breadcrumbs: string[]): number | null {
  for (let i = breadcrumbs.length - 1; i >= 0; i--) {
    const match = breadcrumbs[i].match(/\[(\d{3})\]/)
    if (match) return parseInt(match[1], 10)
  }
  return null
}

function hasHTTPStatusRange(text: string, min: number, max: number): boolean {
  const matches = text.match(/\b[1-5]\d{2}\b/g)
  if (!matches) return false
  return matches.some((m) => {
    const code = parseInt(m, 10)
    return code >= min && code <= max
  })
}

// ---------- main ----------

export function buildFeatures(incident: ParsedIncident): MLFeatures {
  const titleText = incident.title.toLowerCase()
  const stackText = incident.stackTrace.join("\n").toLowerCase()
  const tagText = Object.values(incident.tags).join("\n").toLowerCase()
  const breadcrumbText = incident.breadcrumbs.join("\n").toLowerCase()

  const concatenatedText = [titleText, stackText, breadcrumbText, tagText]
    .filter((t) => t.length > 0)
    .join("\n")

  const handledTag = incident.tags["handled"]?.toLowerCase()
  const runtimeTag = incident.tags["runtime.name"]?.toLowerCase()
  const osTag = (incident.tags["os"] ?? incident.tags["os.name"] ?? "").toLowerCase()
  const envLower = (incident.environment ?? "").toLowerCase()
  const serverName = (incident.tags["server_name"] ?? "").toLowerCase()

  const errorClass = extractErrorClass(incident.title)
  const httpMethod = extractHTTPMethod(incident.route)
  const lastHTTPStatus = extractLastHTTPStatus(incident.breadcrumbs)

  const totalFrames = incident.stackTrace.length
  const appFrames = incident.stackTrace.filter((f) => !isVendorFrame(f))
  const appFrameCount = appFrames.length

  const route = incident.route ?? ""
  const routeLower = route.toLowerCase()
  const urlTag = (incident.tags["url"] ?? "").toLowerCase()
  const combinedRoute = `${routeLower} ${urlTag}`

  return {
    concatenatedText,
    titleText,
    stackText,
    tagText,

    // existing keyword booleans
    hasTimeoutTerms: containsAny(concatenatedText, TIMEOUT_TERMS),
    hasDatabaseTerms: containsAny(concatenatedText, DATABASE_TERMS),
    hasAuthTerms: containsAny(concatenatedText, AUTH_TERMS),
    hasRuntimeErrorTerms: containsAny(concatenatedText, RUNTIME_ERROR_TERMS),
    hasValidationTerms: containsAny(concatenatedText, VALIDATION_TERMS),
    isProduction: envLower === "production" || envLower === "prod",
    hasCriticalRoute: containsAny(combinedRoute, CRITICAL_ROUTE_PATTERNS),
    hasIntegrationTerms: containsAny(concatenatedText, INTEGRATION_TERMS),
    hasInfraTerms: containsAny(concatenatedText, INFRA_TERMS),
    isHandled: handledTag === "yes" || handledTag === "true",
    hasNodeRuntime: runtimeTag === "node",

    // A. error type
    isTypeError: errorClass === "typeerror",
    isRangeError: errorClass === "rangeerror",
    isSyntaxError: errorClass === "syntaxerror",
    isReferenceError: errorClass === "referenceerror",
    isNativeError: NATIVE_ERRORS.includes(errorClass),
    isCustomError: errorClass.length > 0 && !NATIVE_ERRORS.includes(errorClass),

    // B. Node.js error codes
    hasECONNREFUSED: concatenatedText.includes("econnrefused"),
    hasECONNRESET: concatenatedText.includes("econnreset"),
    hasENOTFOUND: concatenatedText.includes("enotfound"),
    hasEACCES: concatenatedText.includes("eacces") || concatenatedText.includes("eperm"),
    hasENOENT: concatenatedText.includes("enoent"),
    hasHTTPStatus4xx: hasHTTPStatusRange(concatenatedText, 400, 499),
    hasHTTPStatus5xx: hasHTTPStatusRange(concatenatedText, 500, 599),
    hasNodeErrorCode: /\be[a-z]{2,20}\b/.test(concatenatedText) && /\be(conn|not|no|acc|perm|exist|again|pipe|timedout)/i.test(concatenatedText),

    // C. stack trace structural
    stackDepth: totalFrames,
    appFrameCount,
    appFrameRatio: totalFrames > 0 ? appFrameCount / totalFrames : 0,
    topFrameIsVendor: totalFrames > 0 && isVendorFrame(incident.stackTrace[0]),
    hasORMInStack: containsAnyInLines(incident.stackTrace, ORM_LIBS),
    hasDBDriverInStack: containsAnyInLines(incident.stackTrace, DB_DRIVERS),
    hasHTTPClientInStack: containsAnyInLines(incident.stackTrace, HTTP_CLIENTS),
    hasQueueInStack: containsAnyInLines(incident.stackTrace, QUEUE_LIBS),
    hasAuthLibInStack: containsAnyInLines(incident.stackTrace, AUTH_LIBS),
    hasFrameworkInStack: containsAnyInLines(incident.stackTrace, FRAMEWORKS),
    hasValidatorInStack: containsAnyInLines(incident.stackTrace, VALIDATORS),

    // D. architectural patterns
    hasMiddlewarePattern: stackText.includes("middleware"),
    hasControllerPattern: stackText.includes("controller"),
    hasServicePattern: stackText.includes("service"),
    hasRepositoryPattern: stackText.includes("repository") || stackText.includes("repo"),
    hasResolverPattern: stackText.includes("resolver"),
    hasGuardPattern: stackText.includes("guard"),
    hasInterceptorPattern: stackText.includes("interceptor"),

    // E. route / HTTP
    isGET: httpMethod === "GET",
    isPOST: httpMethod === "POST",
    isPUTorPATCH: httpMethod === "PUT" || httpMethod === "PATCH",
    isDELETE: httpMethod === "DELETE",
    isAPIRoute: /\/(api|v[0-9]+|graphql)\b/.test(combinedRoute),
    routeSegmentCount: countRouteSegments(incident.route),

    // F. breadcrumbs
    breadcrumbCount: incident.breadcrumbs.length,
    hasHTTPBreadcrumbs: incident.breadcrumbs.some((b) => /https?:\/\//.test(b)),
    hasDBQueryBreadcrumbs: incident.breadcrumbs.some((b) => {
      const lower = b.toLowerCase()
      return lower.includes("query") || lower.includes("select ") || lower.includes("insert ")
    }),
    lastBreadcrumbIs4xx: lastHTTPStatus !== null && lastHTTPStatus >= 400 && lastHTTPStatus < 500,
    lastBreadcrumbIs5xx: lastHTTPStatus !== null && lastHTTPStatus >= 500 && lastHTTPStatus < 600,

    // G. context / infra
    isStaging: envLower === "staging" || envLower === "stg",
    isServerOS: osTag.includes("linux") || osTag.includes("alpine") || osTag.includes("debian") || osTag.includes("ubuntu") || osTag.includes("centos"),
    isLambda: serverName.includes("lambda") || concatenatedText.includes("/var/task") || (incident.tags["function_name"] ?? "").length > 0,
    isDocker: osTag.includes("alpine") || /^[a-f0-9]{12}$/.test(serverName) || serverName.includes("container"),
    isKubernetes: /^[a-z]+-[a-z0-9]+-[a-z0-9]{5}$/.test(serverName) || (incident.tags["kubernetes"] ?? "").length > 0,
    hasCloudProvider:
      serverName.includes(".ec2.") || serverName.includes("compute.googleapis") ||
      serverName.includes(".azure.") || tagText.includes("aws") ||
      tagText.includes("gcp") || tagText.includes("azure"),

    // H. text metrics
    titleWordCount: incident.title.split(/\s+/).filter((w) => w.length > 0).length,
    titleHasColon: incident.title.includes(":"),
    hasStackTrace: incident.stackTrace.length > 0,
    errorMessageLength: Math.min(incident.title.length / 200, 1)
  }
}
