import type { IncidentCategory } from "~/shared/types/incident"

export interface MLFeatures {
  // --- text (not used by ONNX, used by kNN) ---
  concatenatedText: string
  titleText: string
  stackText: string
  tagText: string

  // --- existing keyword booleans (11) ---
  hasTimeoutTerms: boolean
  hasDatabaseTerms: boolean
  hasAuthTerms: boolean
  hasRuntimeErrorTerms: boolean
  hasValidationTerms: boolean
  isProduction: boolean
  hasCriticalRoute: boolean
  hasIntegrationTerms: boolean
  hasInfraTerms: boolean
  isHandled: boolean
  hasNodeRuntime: boolean

  // --- A. error type (6) ---
  isTypeError: boolean
  isRangeError: boolean
  isSyntaxError: boolean
  isReferenceError: boolean
  isNativeError: boolean
  isCustomError: boolean

  // --- B. Node.js error codes (8) ---
  hasECONNREFUSED: boolean
  hasECONNRESET: boolean
  hasENOTFOUND: boolean
  hasEACCES: boolean
  hasENOENT: boolean
  hasHTTPStatus4xx: boolean
  hasHTTPStatus5xx: boolean
  hasNodeErrorCode: boolean

  // --- C. stack trace structural (11) ---
  stackDepth: number
  appFrameCount: number
  appFrameRatio: number
  topFrameIsVendor: boolean
  hasORMInStack: boolean
  hasDBDriverInStack: boolean
  hasHTTPClientInStack: boolean
  hasQueueInStack: boolean
  hasAuthLibInStack: boolean
  hasFrameworkInStack: boolean
  hasValidatorInStack: boolean

  // --- D. architectural patterns in stack (7) ---
  hasMiddlewarePattern: boolean
  hasControllerPattern: boolean
  hasServicePattern: boolean
  hasRepositoryPattern: boolean
  hasResolverPattern: boolean
  hasGuardPattern: boolean
  hasInterceptorPattern: boolean

  // --- E. route / HTTP (6) ---
  isGET: boolean
  isPOST: boolean
  isPUTorPATCH: boolean
  isDELETE: boolean
  isAPIRoute: boolean
  routeSegmentCount: number

  // --- F. breadcrumbs (5) ---
  breadcrumbCount: number
  hasHTTPBreadcrumbs: boolean
  hasDBQueryBreadcrumbs: boolean
  lastBreadcrumbIs4xx: boolean
  lastBreadcrumbIs5xx: boolean

  // --- G. context / infra (6) ---
  isStaging: boolean
  isServerOS: boolean
  isLambda: boolean
  isDocker: boolean
  isKubernetes: boolean
  hasCloudProvider: boolean

  // --- H. text metrics (4) ---
  titleWordCount: number
  titleHasColon: boolean
  hasStackTrace: boolean
  errorMessageLength: number
}

export interface MLClassificationResult {
  category: IncidentCategory
  confidence: number
  signals: string[]
}
