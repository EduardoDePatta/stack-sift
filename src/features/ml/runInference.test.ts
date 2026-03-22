import { describe, expect, it } from "vitest"
import type { MLFeatures } from "./types"
import {
  _mockInference,
  _parseModelOutput,
  featuresToArray,
  runInference
} from "./runInference"

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

describe("mockInference", () => {
  it("returns unknown with 0 confidence when no flags match", () => {
    const result = _mockInference(makeFeatures())
    expect(result.category).toBe("unknown")
    expect(result.confidence).toBe(0)
    expect(result.signals).toContain("mock:no-match")
  })

  it("returns timeout with moderate confidence for single flag", () => {
    const result = _mockInference(
      makeFeatures({ hasTimeoutTerms: true })
    )
    expect(result.category).toBe("timeout")
    expect(result.confidence).toBe(0.6)
    expect(result.signals).toContain("mock:timeout")
  })

  it("returns database for single database flag", () => {
    const result = _mockInference(
      makeFeatures({ hasDatabaseTerms: true })
    )
    expect(result.category).toBe("database")
    expect(result.confidence).toBe(0.6)
  })

  it("returns auth for single auth flag", () => {
    const result = _mockInference(
      makeFeatures({ hasAuthTerms: true })
    )
    expect(result.category).toBe("auth")
    expect(result.confidence).toBe(0.6)
  })

  it("returns runtime for single runtime flag", () => {
    const result = _mockInference(
      makeFeatures({ hasRuntimeErrorTerms: true })
    )
    expect(result.category).toBe("runtime")
    expect(result.confidence).toBe(0.6)
  })

  it("returns validation for single validation flag", () => {
    const result = _mockInference(
      makeFeatures({ hasValidationTerms: true })
    )
    expect(result.category).toBe("validation")
    expect(result.confidence).toBe(0.6)
  })

  it("returns lower confidence for multiple flags (ambiguous)", () => {
    const result = _mockInference(
      makeFeatures({
        hasTimeoutTerms: true,
        hasDatabaseTerms: true
      })
    )
    expect(result.confidence).toBe(0.4)
    expect(result.signals.length).toBe(2)
  })
})

describe("parseModelOutput", () => {
  it("picks the category with highest score", () => {
    const output = [0.1, 0.9, 0.05, 0.02, 0.01, 0.0, 0.0, 0.0]
    const result = _parseModelOutput(output)
    expect(result.category).toBe("database")
    expect(result.confidence).toBe(0.9)
  })

  it("picks timeout when it has the highest score", () => {
    const output = [0.85, 0.1, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0]
    const result = _parseModelOutput(output)
    expect(result.category).toBe("timeout")
    expect(result.confidence).toBe(0.85)
  })

  it("clamps confidence to [0, 1]", () => {
    const output = [1.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    const result = _parseModelOutput(output)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it("returns unknown for last index", () => {
    const output = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.95]
    const result = _parseModelOutput(output)
    expect(result.category).toBe("unknown")
  })
})

describe("featuresToArray", () => {
  it("produces an array of length 64", () => {
    const arr = featuresToArray(makeFeatures())
    expect(arr.length).toBe(64)
  })

  it("converts booleans to 0/1 and keeps numbers", () => {
    const arr = featuresToArray(
      makeFeatures({
        hasTimeoutTerms: true,
        stackDepth: 10,
        appFrameRatio: 0.75
      })
    )
    expect(arr[0]).toBe(1.0)
    expect(arr[1]).toBe(0.0)
    expect(arr[25]).toBe(10)
    expect(arr[27]).toBe(0.75)
  })
})

describe("runInference", () => {
  it("falls back to mock when model is not available", async () => {
    const result = await runInference(
      makeFeatures({ hasDatabaseTerms: true })
    )
    expect(result.category).toBe("database")
    expect(result.confidence).toBe(0.6)
    expect(result.signals).toContain("mock:database")
  })

  it("returns unknown for empty features via mock", async () => {
    const result = await runInference(makeFeatures())
    expect(result.category).toBe("unknown")
    expect(result.confidence).toBe(0)
  })

  it("returns valid MLClassificationResult shape", async () => {
    const result = await runInference(
      makeFeatures({ hasAuthTerms: true })
    )
    expect(result).toHaveProperty("category")
    expect(result).toHaveProperty("confidence")
    expect(result).toHaveProperty("signals")
    expect(typeof result.category).toBe("string")
    expect(typeof result.confidence).toBe("number")
    expect(Array.isArray(result.signals)).toBe(true)
  })
})
