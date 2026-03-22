import type { IncidentCategory } from "~/shared/types/incident"
import { getModelSession } from "./modelLoader"
import type { MLClassificationResult, MLFeatures } from "./types"

const CATEGORY_INDEX: IncidentCategory[] = [
  "timeout",
  "database",
  "auth",
  "runtime",
  "validation",
  "integration",
  "infra",
  "unknown"
]

function mockInference(features: MLFeatures): MLClassificationResult {
  const flagMap: Array<{ flag: boolean; category: IncidentCategory }> = [
    { flag: features.hasTimeoutTerms, category: "timeout" },
    { flag: features.hasDatabaseTerms, category: "database" },
    { flag: features.hasAuthTerms, category: "auth" },
    { flag: features.hasRuntimeErrorTerms, category: "runtime" },
    { flag: features.hasValidationTerms, category: "validation" },
    { flag: features.hasIntegrationTerms, category: "integration" },
    { flag: features.hasInfraTerms, category: "infra" }
  ]

  const matched = flagMap.filter((f) => f.flag)

  if (matched.length === 0) {
    return { category: "unknown", confidence: 0, signals: ["mock:no-match"] }
  }

  if (matched.length === 1) {
    return {
      category: matched[0].category,
      confidence: 0.6,
      signals: [`mock:${matched[0].category}`]
    }
  }

  return {
    category: matched[0].category,
    confidence: 0.4,
    signals: matched.map((m) => `mock:${m.category}`)
  }
}

function parseModelOutput(
  outputData: Float32Array | number[]
): MLClassificationResult {
  let maxIdx = 0
  let maxVal = -Infinity
  for (let i = 0; i < outputData.length && i < CATEGORY_INDEX.length; i++) {
    if (outputData[i] > maxVal) {
      maxVal = outputData[i]
      maxIdx = i
    }
  }

  const category = CATEGORY_INDEX[maxIdx] ?? "unknown"
  const confidence = Math.max(0, Math.min(maxVal, 1))

  return {
    category,
    confidence: Math.round(confidence * 100) / 100,
    signals: [`model:${category}`]
  }
}

export async function runInference(
  features: MLFeatures
): Promise<MLClassificationResult> {
  const session = await getModelSession()

  if (!session) {
    return mockInference(features)
  }

  try {
    const { Tensor } = await import("onnxruntime-web")

    const boolFlags: number[] = [
      // existing keyword booleans (11)
      features.hasTimeoutTerms ? 1.0 : 0.0,
      features.hasDatabaseTerms ? 1.0 : 0.0,
      features.hasAuthTerms ? 1.0 : 0.0,
      features.hasRuntimeErrorTerms ? 1.0 : 0.0,
      features.hasValidationTerms ? 1.0 : 0.0,
      features.isProduction ? 1.0 : 0.0,
      features.hasCriticalRoute ? 1.0 : 0.0,
      features.hasIntegrationTerms ? 1.0 : 0.0,
      features.hasInfraTerms ? 1.0 : 0.0,
      features.isHandled ? 1.0 : 0.0,
      features.hasNodeRuntime ? 1.0 : 0.0,
      // A. error type (6)
      features.isTypeError ? 1.0 : 0.0,
      features.isRangeError ? 1.0 : 0.0,
      features.isSyntaxError ? 1.0 : 0.0,
      features.isReferenceError ? 1.0 : 0.0,
      features.isNativeError ? 1.0 : 0.0,
      features.isCustomError ? 1.0 : 0.0,
      // B. Node.js error codes (8)
      features.hasECONNREFUSED ? 1.0 : 0.0,
      features.hasECONNRESET ? 1.0 : 0.0,
      features.hasENOTFOUND ? 1.0 : 0.0,
      features.hasEACCES ? 1.0 : 0.0,
      features.hasENOENT ? 1.0 : 0.0,
      features.hasHTTPStatus4xx ? 1.0 : 0.0,
      features.hasHTTPStatus5xx ? 1.0 : 0.0,
      features.hasNodeErrorCode ? 1.0 : 0.0,
      // C. stack trace structural (11)
      features.stackDepth,
      features.appFrameCount,
      features.appFrameRatio,
      features.topFrameIsVendor ? 1.0 : 0.0,
      features.hasORMInStack ? 1.0 : 0.0,
      features.hasDBDriverInStack ? 1.0 : 0.0,
      features.hasHTTPClientInStack ? 1.0 : 0.0,
      features.hasQueueInStack ? 1.0 : 0.0,
      features.hasAuthLibInStack ? 1.0 : 0.0,
      features.hasFrameworkInStack ? 1.0 : 0.0,
      features.hasValidatorInStack ? 1.0 : 0.0,
      // D. architectural patterns (7)
      features.hasMiddlewarePattern ? 1.0 : 0.0,
      features.hasControllerPattern ? 1.0 : 0.0,
      features.hasServicePattern ? 1.0 : 0.0,
      features.hasRepositoryPattern ? 1.0 : 0.0,
      features.hasResolverPattern ? 1.0 : 0.0,
      features.hasGuardPattern ? 1.0 : 0.0,
      features.hasInterceptorPattern ? 1.0 : 0.0,
      // E. route / HTTP (6)
      features.isGET ? 1.0 : 0.0,
      features.isPOST ? 1.0 : 0.0,
      features.isPUTorPATCH ? 1.0 : 0.0,
      features.isDELETE ? 1.0 : 0.0,
      features.isAPIRoute ? 1.0 : 0.0,
      features.routeSegmentCount,
      // F. breadcrumbs (5)
      features.breadcrumbCount,
      features.hasHTTPBreadcrumbs ? 1.0 : 0.0,
      features.hasDBQueryBreadcrumbs ? 1.0 : 0.0,
      features.lastBreadcrumbIs4xx ? 1.0 : 0.0,
      features.lastBreadcrumbIs5xx ? 1.0 : 0.0,
      // G. context / infra (6)
      features.isStaging ? 1.0 : 0.0,
      features.isServerOS ? 1.0 : 0.0,
      features.isLambda ? 1.0 : 0.0,
      features.isDocker ? 1.0 : 0.0,
      features.isKubernetes ? 1.0 : 0.0,
      features.hasCloudProvider ? 1.0 : 0.0,
      // H. text metrics (4)
      features.titleWordCount,
      features.titleHasColon ? 1.0 : 0.0,
      features.hasStackTrace ? 1.0 : 0.0,
      features.errorMessageLength
    ]

    const inputTensor = new Tensor("float32", Float32Array.from(boolFlags), [
      1,
      boolFlags.length
    ])

    const inputName = session.inputNames[0] ?? "input"
    const feeds = { [inputName]: inputTensor }

    const results = await session.run(feeds as Parameters<typeof session.run>[0])
    const outputName = session.outputNames[0] ?? "output"
    const outputTensor = results[outputName]
    const outputData = outputTensor?.data as Float32Array

    return parseModelOutput(outputData)
  } catch {
    return mockInference(features)
  }
}

export { mockInference as _mockInference }
export { parseModelOutput as _parseModelOutput }
