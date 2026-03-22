import { buildEditorUri } from "./editorUri"
import { parseFrame } from "./frameParser"
import { mapToSourcePath } from "./pathMapper"
import { getEditorSettings } from "./settings"

export async function openFrameInEditor(
  frameString: string
): Promise<{ success: boolean; uri?: string; error?: string }> {
  const parsed = parseFrame(frameString)
  if (!parsed) {
    return { success: false, error: "Não foi possível interpretar o frame" }
  }

  const settings = await getEditorSettings()
  if (!settings.projectRoot) {
    return {
      success: false,
      error: "Configure o caminho do projeto para abrir no editor"
    }
  }

  const relativePath = mapToSourcePath(parsed.filePath)

  const uri = buildEditorUri({
    editor: settings.editor,
    projectRoot: settings.projectRoot,
    relativePath,
    line: parsed.line,
    column: parsed.column
  })

  window.open(uri, "_blank")

  return { success: true, uri }
}
