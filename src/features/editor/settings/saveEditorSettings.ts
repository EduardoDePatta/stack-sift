import { EDITOR_SETTINGS_STORAGE_KEY } from "./data/editorSettingsDefaults"
import type { EditorSettings } from "./editorSettingsTypes"
import { getEditorSettings } from "./getEditorSettings"

export async function saveEditorSettings(
  settings: Partial<EditorSettings>
): Promise<void> {
  const current = await getEditorSettings()
  const merged = { ...current, ...settings }
  await chrome.storage.local.set({ [EDITOR_SETTINGS_STORAGE_KEY]: merged })
}
