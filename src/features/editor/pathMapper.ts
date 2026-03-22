const BUILD_PREFIXES = [
  "/app/dist/",
  "/app/build/",
  "/app/.next/server/",
  "/var/task/",
  "/opt/nodejs/",
  "app/dist/",
  "app/build/"
]

const EXTENSION_MAP: Record<string, string> = {
  ".js": ".ts",
  ".jsx": ".tsx",
  ".mjs": ".mts"
}

function stripBuildPrefix(filePath: string): string {
  for (const prefix of BUILD_PREFIXES) {
    if (filePath.startsWith(prefix)) {
      return filePath.slice(prefix.length)
    }
  }

  if (filePath.startsWith("/")) {
    const withoutRoot = filePath.replace(/^\/[^/]+\//, "")
    for (const prefix of BUILD_PREFIXES) {
      const clean = prefix.replace(/^\//, "")
      if (withoutRoot.startsWith(clean)) {
        return withoutRoot.slice(clean.length)
      }
    }
  }

  return filePath
}

function mapExtension(filePath: string): string {
  for (const [from, to] of Object.entries(EXTENSION_MAP)) {
    if (filePath.endsWith(from)) {
      return filePath.slice(0, -from.length) + to
    }
  }
  return filePath
}

export function mapToSourcePath(buildPath: string): string {
  const stripped = stripBuildPrefix(buildPath)
  return mapExtension(stripped)
}
