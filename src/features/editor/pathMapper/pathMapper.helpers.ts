import { BUILD_PATH_PREFIXES } from "./data/buildPrefixes"
import { SOURCE_EXTENSION_MAP } from "./data/sourceExtensionMap"

export function stripBuildPrefix(filePath: string): string {
  for (const prefix of BUILD_PATH_PREFIXES) {
    if (filePath.startsWith(prefix)) {
      return filePath.slice(prefix.length)
    }
  }

  if (filePath.startsWith("/")) {
    const withoutRoot = filePath.replace(/^\/[^/]+\//, "")
    for (const prefix of BUILD_PATH_PREFIXES) {
      const clean = prefix.replace(/^\//, "")
      if (withoutRoot.startsWith(clean)) {
        return withoutRoot.slice(clean.length)
      }
    }
  }

  return filePath
}

export function mapSourceExtension(filePath: string): string {
  for (const [from, to] of Object.entries(SOURCE_EXTENSION_MAP)) {
    if (filePath.endsWith(from)) {
      return filePath.slice(0, -from.length) + to
    }
  }
  return filePath
}
