export type EditorType = "vscode" | "cursor"

const SCHEME: Record<EditorType, string> = {
  vscode: "vscode",
  cursor: "cursor"
}

export function buildEditorUri(options: {
  editor: EditorType
  projectRoot: string
  relativePath: string
  line?: number | null
  column?: number | null
}): string {
  const { editor, projectRoot, relativePath, line, column } = options
  const scheme = SCHEME[editor]

  const root = projectRoot.endsWith("/") ? projectRoot : projectRoot + "/"
  const fullPath = root + relativePath

  let uri = `${scheme}://file/${fullPath}`

  if (line != null && line > 0) {
    uri += `:${line}`
    if (column != null && column > 0) {
      uri += `:${column}`
    }
  }

  return uri
}
