import type { ParsedIncident } from "~/shared/types/incident"
import { extractBreadcrumbs } from "./internal/breadcrumbs"
import { extractStackTrace } from "./internal/stackTrace"
import { extractTags, extractTagValue } from "./internal/tags"
import { extractTitle } from "./internal/title"

export function extractIncidentFromDOM(doc: Document): ParsedIncident {
  return {
    title: extractTitle(doc),
    stackTrace: extractStackTrace(doc),
    breadcrumbs: extractBreadcrumbs(doc),
    environment: extractTagValue(doc, "environment"),
    release: extractTagValue(doc, "release"),
    route:
      extractTagValue(doc, "transaction") ??
      extractTagValue(doc, "url"),
    tags: extractTags(doc)
  }
}
