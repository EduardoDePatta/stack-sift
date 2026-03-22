import { textOf } from "./text"

export function extractTitle(doc: Document): string {
  const exceptionValue = doc.querySelector(
    '[data-test-id="exception-value"]'
  )
  if (exceptionValue) {
    const errorType = textOf(exceptionValue.querySelector("h5"))
    const errorMsg = textOf(exceptionValue.querySelector("pre"))
    if (errorType && errorMsg) return `${errorType}: ${errorMsg}`
    if (errorType) return errorType
    if (errorMsg) return errorMsg
  }

  const h1 = textOf(doc.querySelector("h1"))
  if (h1) return h1

  return ""
}
