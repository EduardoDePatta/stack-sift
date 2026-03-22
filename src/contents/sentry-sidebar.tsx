import cssText from "data-text:./sentry-sidebar.css"
import type { PlasmoCSConfig } from "plasmo"

import { SentrySidebarApp } from "./sentry-sidebar/SentrySidebarApp"

export const config: PlasmoCSConfig = {
  matches: ["https://*.sentry.io/*"]
}

export const getShadowHostId = () => "stack-sift-sidebar"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export default SentrySidebarApp
