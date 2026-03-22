import type { IncidentCategory } from "~/shared/types/incident"

export interface MLFeatures {
  concatenatedText: string
  titleText: string
  stackText: string
  tagText: string

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

  isTypeError: boolean
  isRangeError: boolean
  isSyntaxError: boolean
  isReferenceError: boolean
  isNativeError: boolean
  isCustomError: boolean

  hasECONNREFUSED: boolean
  hasECONNRESET: boolean
  hasENOTFOUND: boolean
  hasEACCES: boolean
  hasENOENT: boolean
  hasHTTPStatus4xx: boolean
  hasHTTPStatus5xx: boolean
  hasNodeErrorCode: boolean

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

  hasMiddlewarePattern: boolean
  hasControllerPattern: boolean
  hasServicePattern: boolean
  hasRepositoryPattern: boolean
  hasResolverPattern: boolean
  hasGuardPattern: boolean
  hasInterceptorPattern: boolean

  isGET: boolean
  isPOST: boolean
  isPUTorPATCH: boolean
  isDELETE: boolean
  isAPIRoute: boolean
  routeSegmentCount: number

  breadcrumbCount: number
  hasHTTPBreadcrumbs: boolean
  hasDBQueryBreadcrumbs: boolean
  lastBreadcrumbIs4xx: boolean
  lastBreadcrumbIs5xx: boolean

  isStaging: boolean
  isServerOS: boolean
  isLambda: boolean
  isDocker: boolean
  isKubernetes: boolean
  hasCloudProvider: boolean

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
