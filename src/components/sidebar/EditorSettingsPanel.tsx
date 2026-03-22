import { useCallback, useEffect, useState } from "react"
import { buildEditorUri } from "~/features/editor/buildEditorUri"
import type { EditorType } from "~/features/editor/editorType"
import { parseFrame } from "~/features/editor/frameParser/parseFrame"
import { mapToSourcePath } from "~/features/editor/pathMapper/mapToSourcePath"
import { getEditorSettings, saveEditorSettings } from "~/features/editor/settings"

export function EditorSettingsPanel({
  onSave,
  frame
}: {
  onSave: () => void
  frame?: string
}) {
  const [projectRoot, setProjectRoot] = useState("")
  const [editor, setEditor] = useState<EditorType>("cursor")
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getEditorSettings().then((s) => {
      setProjectRoot(s.projectRoot)
      setEditor(s.editor)
      setLoading(false)
    })
  }, [])

  const handleSave = useCallback(async () => {
    await saveEditorSettings({ projectRoot, editor })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onSave()
    }, 1200)
  }, [projectRoot, editor, onSave])

  const preview = (() => {
    if (!frame || !projectRoot) return null
    const parsed = parseFrame(frame)
    if (!parsed) return null
    const rel = mapToSourcePath(parsed.filePath)
    return buildEditorUri({
      editor,
      projectRoot,
      relativePath: rel,
      line: parsed.line,
      column: parsed.column
    })
  })()

  if (loading) return null

  return (
    <div className="ss-editor-settings">
      <label className="ss-editor-label">
        Caminho do projeto
        <input
          type="text"
          className="ss-editor-input"
          placeholder="/Users/you/dev/my-api"
          value={projectRoot}
          onChange={(e) => { setProjectRoot(e.target.value); setSaved(false) }}
        />
      </label>
      <p className="ss-editor-hint">
        Dica: abra o terminal na raiz do projeto e rode <code>pwd</code> para copiar o caminho.
      </p>
      <label className="ss-editor-label">
        Editor
        <select
          className="ss-editor-select"
          value={editor}
          onChange={(e) => { setEditor(e.target.value as EditorType); setSaved(false) }}>
          <option value="cursor">Cursor</option>
          <option value="vscode">VS Code</option>
        </select>
      </label>
      {preview && (
        <div className="ss-editor-preview">
          <span className="ss-editor-preview-label">Preview:</span>
          <code className="ss-editor-preview-uri">{preview}</code>
        </div>
      )}
      {saved ? (
        <div className="ss-editor-saved">Salvo!</div>
      ) : (
        <button
          className="ss-editor-save"
          onClick={handleSave}
          disabled={!projectRoot.trim()}>
          Salvar
        </button>
      )}
    </div>
  )
}
