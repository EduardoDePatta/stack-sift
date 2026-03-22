import { describe, expect, it } from "vitest"
import type { MLFeatures } from "~/features/ml/types"
import type { FeedbackExample } from "./types"
import { classifyWithFeedback } from "./adaptiveClassifier/classifyWithFeedback"

function makeFeatures(overrides: Partial<MLFeatures> = {}): MLFeatures {
  return {
    concatenatedText: "",
    titleText: "",
    stackText: "",
    tagText: "",
    hasTimeoutTerms: false,
    hasDatabaseTerms: false,
    hasAuthTerms: false,
    hasRuntimeErrorTerms: false,
    hasValidationTerms: false,
    isProduction: false,
    hasCriticalRoute: false,
    hasIntegrationTerms: false,
    hasInfraTerms: false,
    isHandled: false,
    hasNodeRuntime: false,
    isTypeError: false,
    isRangeError: false,
    isSyntaxError: false,
    isReferenceError: false,
    isNativeError: false,
    isCustomError: false,
    hasECONNREFUSED: false,
    hasECONNRESET: false,
    hasENOTFOUND: false,
    hasEACCES: false,
    hasENOENT: false,
    hasHTTPStatus4xx: false,
    hasHTTPStatus5xx: false,
    hasNodeErrorCode: false,
    stackDepth: 0,
    appFrameCount: 0,
    appFrameRatio: 0,
    topFrameIsVendor: false,
    hasORMInStack: false,
    hasDBDriverInStack: false,
    hasHTTPClientInStack: false,
    hasQueueInStack: false,
    hasAuthLibInStack: false,
    hasFrameworkInStack: false,
    hasValidatorInStack: false,
    hasMiddlewarePattern: false,
    hasControllerPattern: false,
    hasServicePattern: false,
    hasRepositoryPattern: false,
    hasResolverPattern: false,
    hasGuardPattern: false,
    hasInterceptorPattern: false,
    isGET: false,
    isPOST: false,
    isPUTorPATCH: false,
    isDELETE: false,
    isAPIRoute: false,
    routeSegmentCount: 0,
    breadcrumbCount: 0,
    hasHTTPBreadcrumbs: false,
    hasDBQueryBreadcrumbs: false,
    lastBreadcrumbIs4xx: false,
    lastBreadcrumbIs5xx: false,
    isStaging: false,
    isServerOS: false,
    isLambda: false,
    isDocker: false,
    isKubernetes: false,
    hasCloudProvider: false,
    titleWordCount: 0,
    titleHasColon: false,
    hasStackTrace: false,
    errorMessageLength: 0,
    ...overrides
  }
}

function makeExample(
  category: FeedbackExample["category"],
  text: string,
  id?: string
): FeedbackExample {
  return {
    id: id ?? `test-${Math.random()}`,
    fingerprint: `test-fp-${Math.random()}`,
    features: makeFeatures({ concatenatedText: text }),
    category,
    timestamp: Date.now()
  }
}

describe("classifyWithFeedback", () => {
  it("returns null when fewer than 2 examples", () => {
    const examples = [
      makeExample("database", "QueryFailedError duplicate key constraint")
    ]
    expect(classifyWithFeedback(makeFeatures(), examples)).toBeNull()
  })

  it("returns null when input text is empty and nothing is similar", () => {
    const examples = [
      makeExample("database", "QueryFailedError duplicate key constraint"),
      makeExample("database", "QueryFailedError deadlock detected")
    ]
    const result = classifyWithFeedback(makeFeatures({ concatenatedText: "" }), examples)
    expect(result).toBeNull()
  })

  it("classifies similar database errors correctly", () => {
    const examples = [
      makeExample("database", "QueryFailedError: duplicate key value violates unique constraint PK_users"),
      makeExample("database", "QueryFailedError: duplicate key value violates unique constraint PK_orders"),
      makeExample("timeout", "ETIMEDOUT connect to redis:6379")
    ]

    const result = classifyWithFeedback(
      makeFeatures({ concatenatedText: "QueryFailedError: duplicate key value violates unique constraint PK_sessions" }),
      examples
    )

    expect(result).not.toBeNull()
    expect(result!.category).toBe("database")
    expect(result!.confidence).toBeGreaterThan(0)
  })

  it("classifies timeout based on text similarity", () => {
    const examples = [
      makeExample("timeout", "ETIMEDOUT connect to redis host:6379 timeout after 5000ms"),
      makeExample("timeout", "ETIMEDOUT connect to postgres host:5432 timeout after 3000ms"),
      makeExample("timeout", "ETIMEDOUT connect to rabbitmq host:5672 timeout"),
      makeExample("database", "QueryFailedError: duplicate key value"),
      makeExample("auth", "jwt token expired invalid signature")
    ]

    const result = classifyWithFeedback(
      makeFeatures({ concatenatedText: "ETIMEDOUT connect to mysql host:3306 timeout after 10000ms" }),
      examples
    )

    expect(result).not.toBeNull()
    expect(result!.category).toBe("timeout")
  })

  it("returns valid MLClassificationResult shape", () => {
    const examples = [
      makeExample("auth", "jwt token expired invalid authorization header /app/src/auth/middleware.ts"),
      makeExample("auth", "jwt token expired invalid bearer token /app/src/auth/guard.ts"),
      makeExample("auth", "jwt malformed token authorization failed /app/src/auth/verify.ts")
    ]

    const result = classifyWithFeedback(
      makeFeatures({ concatenatedText: "jwt token expired unauthorized access /app/src/auth/service.ts" }),
      examples
    )

    expect(result).not.toBeNull()
    expect(result!.category).toBeDefined()
    expect(result!.confidence).toBeGreaterThanOrEqual(0)
    expect(result!.confidence).toBeLessThanOrEqual(1)
    expect(Array.isArray(result!.signals)).toBe(true)
    expect(result!.signals.some((s) => s.startsWith("adaptive:"))).toBe(true)
  })

  it("includes example count in signals", () => {
    const examples = [
      makeExample("auth", "jwt token expired invalid signature auth middleware"),
      makeExample("auth", "jwt token expired bearer token auth guard"),
      makeExample("auth", "jwt malformed token authorization failed verify")
    ]

    const result = classifyWithFeedback(
      makeFeatures({ concatenatedText: "jwt token expired auth middleware interceptor" }),
      examples
    )

    expect(result!.signals).toContain("adaptive:n=3")
  })

  it("distinguishes between different error types by text", () => {
    const examples = [
      makeExample("database", "QueryFailedError duplicate key value violates unique constraint /node_modules/typeorm"),
      makeExample("database", "QueryFailedError deadlock detected /node_modules/typeorm"),
      makeExample("database", "QueryFailedError relation table does not exist /node_modules/typeorm"),
      makeExample("timeout", "ETIMEDOUT connect to redis host timeout after 5000ms"),
      makeExample("timeout", "ETIMEDOUT connect to postgres host timeout after 3000ms"),
      makeExample("timeout", "ETIMEDOUT connect to rabbitmq host timeout connection refused")
    ]

    const dbResult = classifyWithFeedback(
      makeFeatures({ concatenatedText: "QueryFailedError null value in column violates not-null constraint /node_modules/typeorm" }),
      examples
    )
    const toResult = classifyWithFeedback(
      makeFeatures({ concatenatedText: "ETIMEDOUT connect to memcached host timeout after 2000ms" }),
      examples
    )

    expect(dbResult!.category).toBe("database")
    expect(toResult!.category).toBe("timeout")
  })

  it("returns null when no neighbor is similar enough", () => {
    const examples = [
      makeExample("database", "QueryFailedError duplicate key constraint"),
      makeExample("database", "QueryFailedError deadlock detected")
    ]

    const result = classifyWithFeedback(
      makeFeatures({ concatenatedText: "CORS policy blocked origin request" }),
      examples
    )

    expect(result).toBeNull()
  })

  it("higher similarity yields higher confidence", () => {
    const examples = [
      makeExample("database", "QueryFailedError: duplicate key value violates unique constraint PK_users /node_modules/typeorm/PostgresQueryRunner.js"),
      makeExample("database", "QueryFailedError: duplicate key value violates unique constraint PK_orders /node_modules/typeorm/PostgresQueryRunner.js"),
      makeExample("timeout", "ETIMEDOUT connect redis host:6379 timeout")
    ]

    const exactish = classifyWithFeedback(
      makeFeatures({ concatenatedText: "QueryFailedError: duplicate key value violates unique constraint PK_sessions /node_modules/typeorm/PostgresQueryRunner.js" }),
      examples
    )

    const loose = classifyWithFeedback(
      makeFeatures({ concatenatedText: "QueryFailedError: relation table constraint /node_modules/typeorm" }),
      examples
    )

    expect(exactish!.category).toBe("database")
    expect(loose?.category ?? "database").toBe("database")
    if (loose) {
      expect(exactish!.confidence).toBeGreaterThanOrEqual(loose.confidence)
    }
  })

  it("includes similarity score in signals", () => {
    const examples = [
      makeExample("database", "QueryFailedError duplicate key value violates constraint"),
      makeExample("database", "QueryFailedError duplicate key value violates constraint")
    ]

    const result = classifyWithFeedback(
      makeFeatures({ concatenatedText: "QueryFailedError duplicate key value" }),
      examples
    )

    expect(result).not.toBeNull()
    expect(result!.signals.some((s) => s.startsWith("adaptive:sim="))).toBe(true)
    expect(result!.signals.some((s) => s.startsWith("adaptive:k="))).toBe(true)
  })
})
