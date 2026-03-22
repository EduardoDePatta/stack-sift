import { mapSourceExtension, stripBuildPrefix } from "./pathMapper.helpers"

export function mapToSourcePath(buildPath: string): string {
  const stripped = stripBuildPrefix(buildPath)
  return mapSourceExtension(stripped)
}
