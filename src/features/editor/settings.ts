import type { EditorType } from "./editorUri"

interface EditorSettings {
  projectRoot: string
  editor: EditorType
}

const STORAGE_KEY = "stacksift:editor-settings"

const DEFAULT_SETTINGS: EditorSettings = {
  projectRoot: "",
  editor: "cursor"
}

export async function getEditorSettings(): Promise<EditorSettings> {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY)
    const stored = data[STORAGE_KEY]
    if (stored && typeof stored === "object") {
      return { ...DEFAULT_SETTINGS, ...stored }
    }
  } catch {
    // outside extension context
  }
  return DEFAULT_SETTINGS
}

export async function saveEditorSettings(
  settings: Partial<EditorSettings>
): Promise<void> {
  const current = await getEditorSettings()
  const merged = { ...current, ...settings }
  await chrome.storage.local.set({ [STORAGE_KEY]: merged })
}
