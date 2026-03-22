import type { EditorSettings } from "../editorSettingsTypes"

export const EDITOR_SETTINGS_STORAGE_KEY = "stacksift:editor-settings"

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  projectRoot: "",
  editor: "cursor"
}
