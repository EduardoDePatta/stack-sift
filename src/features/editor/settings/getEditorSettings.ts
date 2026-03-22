import {
  DEFAULT_EDITOR_SETTINGS,
  EDITOR_SETTINGS_STORAGE_KEY
} from "./data/editorSettingsDefaults"
import type { EditorSettings } from "./editorSettingsTypes"

export async function getEditorSettings(): Promise<EditorSettings> {
  try {
    const data = await chrome.storage.local.get(EDITOR_SETTINGS_STORAGE_KEY)
    const stored = data[EDITOR_SETTINGS_STORAGE_KEY]
    if (stored && typeof stored === "object") {
      return { ...DEFAULT_EDITOR_SETTINGS, ...stored }
    }
  } catch {
  }
  return DEFAULT_EDITOR_SETTINGS
}
