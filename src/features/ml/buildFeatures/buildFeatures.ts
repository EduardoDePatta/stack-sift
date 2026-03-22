import type { ParsedIncident } from "~/shared/types/incident"
import type { MLFeatures } from "../types"
import {
  containsAny,
  containsAnyInLines,
  countRouteSegments,
  extractErrorClass,
  extractHTTPMethod,
  extractLastHTTPStatus,
  hasHTTPStatusRange,
  isVendorFrame
} from "./buildFeatures.helpers"
import { AUTH_LIBS } from "./data/authLibs"
import { AUTH_TERMS } from "./data/authTerms"
import { CRITICAL_ROUTE_PATTERNS } from "./data/criticalRoutePatterns"
import { DATABASE_TERMS } from "./data/databaseTerms"
import { DB_DRIVERS } from "./data/dbDrivers"
import { FRAMEWORKS } from "./data/frameworks"
import { HTTP_CLIENTS } from "./data/httpClients"
import { INFRA_TERMS } from "./data/infraTerms"
import { INTEGRATION_TERMS } from "./data/integrationTerms"
import { NATIVE_ERRORS } from "./data/nativeErrors"
import { ORM_LIBS } from "./data/ormLibs"
import { QUEUE_LIBS } from "./data/queueLibs"
import { RUNTIME_ERROR_TERMS } from "./data/runtimeErrorTerms"
import { TIMEOUT_TERMS } from "./data/timeoutTerms"
import { VALIDATION_TERMS } from "./data/validationTerms"
import { VALIDATORS } from "./data/validators"

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

    isTypeError: errorClass === "typeerror",
    isRangeError: errorClass === "rangeerror",
    isSyntaxError: errorClass === "syntaxerror",
    isReferenceError: errorClass === "referenceerror",
    isNativeError: NATIVE_ERRORS.includes(errorClass),
    isCustomError: errorClass.length > 0 && !NATIVE_ERRORS.includes(errorClass),

    hasECONNREFUSED: concatenatedText.includes("econnrefused"),
    hasECONNRESET: concatenatedText.includes("econnreset"),
    hasENOTFOUND: concatenatedText.includes("enotfound"),
    hasEACCES: concatenatedText.includes("eacces") || concatenatedText.includes("eperm"),
    hasENOENT: concatenatedText.includes("enoent"),
    hasHTTPStatus4xx: hasHTTPStatusRange(concatenatedText, 400, 499),
    hasHTTPStatus5xx: hasHTTPStatusRange(concatenatedText, 500, 599),
    hasNodeErrorCode: /\be[a-z]{2,20}\b/.test(concatenatedText) && /\be(conn|not|no|acc|perm|exist|again|pipe|timedout)/i.test(concatenatedText),

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

    hasMiddlewarePattern: stackText.includes("middleware"),
    hasControllerPattern: stackText.includes("controller"),
    hasServicePattern: stackText.includes("service"),
    hasRepositoryPattern: stackText.includes("repository") || stackText.includes("repo"),
    hasResolverPattern: stackText.includes("resolver"),
    hasGuardPattern: stackText.includes("guard"),
    hasInterceptorPattern: stackText.includes("interceptor"),

    isGET: httpMethod === "GET",
    isPOST: httpMethod === "POST",
    isPUTorPATCH: httpMethod === "PUT" || httpMethod === "PATCH",
    isDELETE: httpMethod === "DELETE",
    isAPIRoute: /\/(api|v[0-9]+|graphql)\b/.test(combinedRoute),
    routeSegmentCount: countRouteSegments(incident.route),

    breadcrumbCount: incident.breadcrumbs.length,
    hasHTTPBreadcrumbs: incident.breadcrumbs.some((b) => /https?:\/\//.test(b)),
    hasDBQueryBreadcrumbs: incident.breadcrumbs.some((b) => {
      const lower = b.toLowerCase()
      return lower.includes("query") || lower.includes("select ") || lower.includes("insert ")
    }),
    lastBreadcrumbIs4xx: lastHTTPStatus !== null && lastHTTPStatus >= 400 && lastHTTPStatus < 500,
    lastBreadcrumbIs5xx: lastHTTPStatus !== null && lastHTTPStatus >= 500 && lastHTTPStatus < 600,

    isStaging: envLower === "staging" || envLower === "stg",
    isServerOS: osTag.includes("linux") || osTag.includes("alpine") || osTag.includes("debian") || osTag.includes("ubuntu") || osTag.includes("centos"),
    isLambda: serverName.includes("lambda") || concatenatedText.includes("/var/task") || (incident.tags["function_name"] ?? "").length > 0,
    isDocker: osTag.includes("alpine") || /^[a-f0-9]{12}$/.test(serverName) || serverName.includes("container"),
    isKubernetes: /^[a-z]+-[a-z0-9]+-[a-z0-9]{5}$/.test(serverName) || (incident.tags["kubernetes"] ?? "").length > 0,
    hasCloudProvider:
      serverName.includes(".ec2.") || serverName.includes("compute.googleapis") ||
      serverName.includes(".azure.") || tagText.includes("aws") ||
      tagText.includes("gcp") || tagText.includes("azure"),

    titleWordCount: incident.title.split(/\s+/).filter((w) => w.length > 0).length,
    titleHasColon: incident.title.includes(":"),
    hasStackTrace: incident.stackTrace.length > 0,
    errorMessageLength: Math.min(incident.title.length / 200, 1)
  }
}
