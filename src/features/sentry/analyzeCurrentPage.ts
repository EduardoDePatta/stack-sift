import { classifyIncident } from "~/features/classification/classifyIncident"
import { extractIncidentFromDOM } from "~/features/dom/extractIncidentFromDOM"
import { classifyWithFeedback } from "~/features/feedback/adaptiveClassifier/classifyWithFeedback"
import { getAllFeedback, getExactFeedback } from "~/features/feedback/storage"
import { buildHypothesis } from "~/features/insights/buildHypothesis"
import { buildRecommendations } from "~/features/insights/recommendations/buildRecommendations"
import { buildSummary } from "~/features/insights/buildSummary"
import { computePriority } from "~/features/insights/computePriority"
import { findAllUsefulFrames } from "~/features/insights/usefulFrame/findAllUsefulFrames"
import { findFirstUsefulFrame } from "~/features/insights/usefulFrame/findFirstUsefulFrame"
import { buildFeatures } from "~/features/ml/buildFeatures"
import { mergeClassification } from "~/features/ml/mergeClassification"
import { runInference } from "~/features/ml/runInference"
import type { AnalysisResult } from "./analysisTypes"

export async function analyzeCurrentPage(
  doc: Document
): Promise<AnalysisResult | null> {
  const incident = extractIncidentFromDOM(doc)

  if (!incident.title) return null

  const heuristic = classifyIncident(incident)
  const features = buildFeatures(incident)

  const exactFeedback = await getExactFeedback(features)

  let classification
  if (exactFeedback) {
    classification = {
      category: exactFeedback.category,
      confidence: 1,
      signals: [`user-feedback:${exactFeedback.category}`]
    }
  } else {
    const mlResult = await runInference(features)
    const feedbackExamples = await getAllFeedback()
    const adaptiveResult = classifyWithFeedback(features, feedbackExamples)
    classification = mergeClassification(heuristic, mlResult, adaptiveResult)
  }

  const summary = buildSummary(classification.category, incident)
  const hypothesis = buildHypothesis(classification.category)
  const recommendations = buildRecommendations(incident, classification.category)
  const priority = computePriority(
    classification.category,
    incident.environment,
    incident.route,
    incident.tags["url"]
  )
  const usefulFrames = findAllUsefulFrames(incident.stackTrace)
  const firstUsefulFrame = findFirstUsefulFrame(incident.stackTrace)

  return {
    insight: {
      classification,
      summary,
      hypothesis,
      recommendations,
      priority,
      firstUsefulFrame,
      usefulFrames
    },
    features,
    existingFeedbackCategory: exactFeedback?.category ?? null
  }
}
