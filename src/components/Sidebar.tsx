import { useCallback, useEffect, useState } from "react"
import type { EditorType } from "~/features/editor/editorUri"
import { buildEditorUri } from "~/features/editor/editorUri"
import { parseFrame } from "~/features/editor/frameParser"
import { openFrameInEditor } from "~/features/editor/openInEditor"
import { mapToSourcePath } from "~/features/editor/pathMapper"
import { getEditorSettings, saveEditorSettings } from "~/features/editor/settings"
import { exportFeedbackAsTrainingJSON, getFeedbackCount } from "~/features/feedback/storage"
import type { IncidentCategory, IncidentInsight } from "~/shared/types/incident"
import { SidebarSection } from "./SidebarSection"

interface SidebarProps {
  insight: IncidentInsight
  onFeedback?: (category: IncidentCategory) => void | Promise<void>
  feedbackSaved?: boolean
  existingFeedbackCategory?: IncidentCategory | null
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#16a34a"
}

const ALL_CATEGORIES: IncidentCategory[] = [
  "timeout",
  "database",
  "auth",
  "runtime",
  "validation",
  "integration",
  "infra",
  "unknown"
]

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="ss-confidence-bar">
      <div className="ss-confidence-fill" style={{ width: `${pct}%` }} />
      <span className="ss-confidence-label">{pct}%</span>
    </div>
  )
}

function FeedbackPanel({
  currentCategory,
  onFeedback,
  feedbackSaved,
  existingCategory
}: {
  currentCategory: IncidentCategory
  onFeedback: (category: IncidentCategory) => void
  feedbackSaved: boolean
  existingCategory: IncidentCategory | null
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (feedbackSaved) {
    return (
      <div className="ss-feedback-saved">
        Feedback salvo! O classificador vai aprender com isso.
      </div>
    )
  }

  if (existingCategory && !isOpen) {
    return (
      <div className="ss-feedback-existing">
        <span>
          Corrigido anteriormente como{" "}
          <strong>{existingCategory}</strong>
        </span>
        <button
          className="ss-feedback-redo"
          onClick={() => setIsOpen(true)}>
          Alterar
        </button>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        className="ss-feedback-trigger"
        onClick={() => setIsOpen(true)}>
        Corrigir categoria
      </button>
    )
  }

  return (
    <div className="ss-feedback-panel">
      <p className="ss-feedback-label">Qual seria a categoria correta?</p>
      <div className="ss-feedback-options">
        {ALL_CATEGORIES.filter((c) => c !== currentCategory).map((cat) => (
          <button
            key={cat}
            className="ss-feedback-option"
            onClick={() => {
              onFeedback(cat)
              setIsOpen(false)
            }}>
            {cat}
          </button>
        ))}
      </div>
      <button
        className="ss-feedback-cancel"
        onClick={() => setIsOpen(false)}>
        Cancelar
      </button>
    </div>
  )
}

function EditorSettingsPanel({
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

function OpenInEditorButton({ frame }: { frame: string }) {
  const [status, setStatus] = useState<
    "idle" | "settings" | "opening" | "error"
  >("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleClick = useCallback(async () => {
    setStatus("opening")
    const result = await openFrameInEditor(frame)
    if (result.success) {
      setStatus("idle")
    } else if (result.error?.includes("Configure")) {
      setStatus("settings")
    } else {
      setErrorMsg(result.error ?? "Erro desconhecido")
      setStatus("error")
    }
  }, [frame])

  if (status === "settings") {
    return (
      <EditorSettingsPanel
        onSave={() => setStatus("idle")}
        frame={frame}
      />
    )
  }

  return (
    <div className="ss-open-editor">
      <button
        className="ss-open-editor-btn"
        onClick={handleClick}
        disabled={status === "opening"}>
        {status === "opening" ? "Abrindo..." : "Abrir no editor"}
      </button>
      <button
        className="ss-open-editor-config"
        onClick={() => setStatus("settings")}
        title="Configurar editor">
        ⚙
      </button>
      {status === "error" && (
        <span className="ss-open-editor-error">{errorMsg}</span>
      )}
    </div>
  )
}

function FrameLabel({ frame }: { frame: string }) {
  const parsed = parseFrame(frame)
  if (!parsed) return <code className="ss-frame-code">{frame}</code>

  const rel = mapToSourcePath(parsed.filePath)
  const short = rel.split("/").slice(-2).join("/")
  const line = parsed.line ? `:${parsed.line}` : ""

  return (
    <code className="ss-frame-code" title={frame}>
      {short}{line}
      {parsed.fn && <span className="ss-frame-fn"> {parsed.fn}</span>}
    </code>
  )
}

function ExportFeedbackButton() {
  const [count, setCount] = useState(0)
  const [status, setStatus] = useState<"idle" | "done">("idle")

  useEffect(() => {
    getFeedbackCount().then(setCount).catch(() => setCount(0))
  }, [])

  const handleExport = useCallback(async () => {
    const json = await exportFeedbackAsTrainingJSON()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stack-sift-feedback-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus("done")
    setTimeout(() => setStatus("idle"), 2000)
  }, [])

  if (count === 0) return null

  return (
    <div className="ss-export-feedback">
      {status === "done" ? (
        <span className="ss-export-done">Exportado!</span>
      ) : (
        <button className="ss-export-btn" onClick={handleExport}>
          Exportar {count} feedback{count > 1 ? "s" : ""} (JSON)
        </button>
      )}
    </div>
  )
}

export function Sidebar({
  insight,
  onFeedback,
  feedbackSaved,
  existingFeedbackCategory
}: SidebarProps) {
  const {
    classification,
    summary,
    hypothesis,
    recommendations,
    priority,
    firstUsefulFrame,
    usefulFrames
  } = insight
  const priorityColor = PRIORITY_COLORS[priority] ?? "#6b7280"

  const otherFrames = usefulFrames.filter((f) => f !== firstUsefulFrame)

  return (
    <div className="ss-sidebar">
      <div className="ss-header">
        <span className="ss-logo">Stack Sift</span>
      </div>

      <SidebarSection title="Category">
        <span className="ss-badge">{classification.category}</span>
      </SidebarSection>

      <SidebarSection title="Confidence">
        <ConfidenceBar value={classification.confidence} />
      </SidebarSection>

      <SidebarSection title="Priority">
        <span className="ss-priority" style={{ color: priorityColor }}>
          {priority.toUpperCase()}
        </span>
      </SidebarSection>

      <SidebarSection title="Summary">
        <p className="ss-text">{summary}</p>
      </SidebarSection>

      {recommendations && recommendations.length > 0 ? (
        <SidebarSection title="Recommendations">
          <ul className="ss-recommendations">
            {recommendations.map((rec, i) => (
              <li key={i} className="ss-recommendation-item">
                {rec.text}
              </li>
            ))}
          </ul>
        </SidebarSection>
      ) : (
        <SidebarSection title="Hypothesis">
          <p className="ss-text">{hypothesis}</p>
        </SidebarSection>
      )}

      {firstUsefulFrame && (
        <SidebarSection title="Origin Frame">
          <FrameLabel frame={firstUsefulFrame} />
          <OpenInEditorButton frame={firstUsefulFrame} />
        </SidebarSection>
      )}

      {otherFrames.length > 0 && (
        <SidebarSection title="Stack Frames">
          <div className="ss-frame-list">
            {otherFrames.map((frame, i) => (
              <div key={i} className="ss-frame-item">
                <FrameLabel frame={frame} />
                <OpenInEditorButton frame={frame} />
              </div>
            ))}
          </div>
        </SidebarSection>
      )}

      {classification.signals.length > 0 && (
        <SidebarSection title="Signals">
          <div className="ss-signals">
            {classification.signals.map((signal) => (
              <span key={signal} className="ss-signal-tag">
                {signal}
              </span>
            ))}
          </div>
        </SidebarSection>
      )}

      {onFeedback && (
        <SidebarSection title="Feedback">
          <FeedbackPanel
            currentCategory={classification.category}
            onFeedback={onFeedback}
            feedbackSaved={feedbackSaved ?? false}
            existingCategory={existingFeedbackCategory ?? null}
          />
          <ExportFeedbackButton />
        </SidebarSection>
      )}
    </div>
  )
}
