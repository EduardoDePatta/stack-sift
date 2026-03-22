"""
Feature names in the EXACT order expected by runInference.ts boolFlags array.
This must stay in sync with src/features/ml/types.ts and runInference.ts.
"""

FEATURE_NAMES = [
    # existing keyword booleans (11)
    "hasTimeoutTerms",
    "hasDatabaseTerms",
    "hasAuthTerms",
    "hasRuntimeErrorTerms",
    "hasValidationTerms",
    "isProduction",
    "hasCriticalRoute",
    "hasIntegrationTerms",
    "hasInfraTerms",
    "isHandled",
    "hasNodeRuntime",
    # A. error type (6)
    "isTypeError",
    "isRangeError",
    "isSyntaxError",
    "isReferenceError",
    "isNativeError",
    "isCustomError",
    # B. Node.js error codes (8)
    "hasECONNREFUSED",
    "hasECONNRESET",
    "hasENOTFOUND",
    "hasEACCES",
    "hasENOENT",
    "hasHTTPStatus4xx",
    "hasHTTPStatus5xx",
    "hasNodeErrorCode",
    # C. stack trace structural (11)
    "stackDepth",
    "appFrameCount",
    "appFrameRatio",
    "topFrameIsVendor",
    "hasORMInStack",
    "hasDBDriverInStack",
    "hasHTTPClientInStack",
    "hasQueueInStack",
    "hasAuthLibInStack",
    "hasFrameworkInStack",
    "hasValidatorInStack",
    # D. architectural patterns (7)
    "hasMiddlewarePattern",
    "hasControllerPattern",
    "hasServicePattern",
    "hasRepositoryPattern",
    "hasResolverPattern",
    "hasGuardPattern",
    "hasInterceptorPattern",
    # E. route / HTTP (6)
    "isGET",
    "isPOST",
    "isPUTorPATCH",
    "isDELETE",
    "isAPIRoute",
    "routeSegmentCount",
    # F. breadcrumbs (5)
    "breadcrumbCount",
    "hasHTTPBreadcrumbs",
    "hasDBQueryBreadcrumbs",
    "lastBreadcrumbIs4xx",
    "lastBreadcrumbIs5xx",
    # G. context / infra (6)
    "isStaging",
    "isServerOS",
    "isLambda",
    "isDocker",
    "isKubernetes",
    "hasCloudProvider",
    # H. text metrics (4)
    "titleWordCount",
    "titleHasColon",
    "hasStackTrace",
    "errorMessageLength",
]

CATEGORIES = [
    "timeout",
    "database",
    "auth",
    "runtime",
    "validation",
    "integration",
    "infra",
    "unknown",
]

assert len(FEATURE_NAMES) == 64, f"Expected 64 features, got {len(FEATURE_NAMES)}"
