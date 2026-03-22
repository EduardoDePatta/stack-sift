import { describe, expect, it } from "vitest"
import { buildEditorUri } from "./editorUri"

describe("buildEditorUri", () => {
  it("builds cursor URI with line and column", () => {
    expect(
      buildEditorUri({
        editor: "cursor",
        projectRoot: "/Users/dev/my-project",
        relativePath: "src/services/user.ts",
        line: 42,
        column: 10
      })
    ).toBe("cursor://file//Users/dev/my-project/src/services/user.ts:42:10")
  })

  it("builds vscode URI with line and column", () => {
    expect(
      buildEditorUri({
        editor: "vscode",
        projectRoot: "/Users/dev/my-project",
        relativePath: "src/services/user.ts",
        line: 42,
        column: 10
      })
    ).toBe("vscode://file//Users/dev/my-project/src/services/user.ts:42:10")
  })

  it("builds URI with line only", () => {
    expect(
      buildEditorUri({
        editor: "cursor",
        projectRoot: "/Users/dev/my-project",
        relativePath: "src/services/user.ts",
        line: 42
      })
    ).toBe("cursor://file//Users/dev/my-project/src/services/user.ts:42")
  })

  it("builds URI without line or column", () => {
    expect(
      buildEditorUri({
        editor: "cursor",
        projectRoot: "/Users/dev/my-project",
        relativePath: "src/services/user.ts"
      })
    ).toBe("cursor://file//Users/dev/my-project/src/services/user.ts")
  })

  it("handles trailing slash on project root", () => {
    expect(
      buildEditorUri({
        editor: "cursor",
        projectRoot: "/Users/dev/my-project/",
        relativePath: "src/services/user.ts",
        line: 10
      })
    ).toBe("cursor://file//Users/dev/my-project/src/services/user.ts:10")
  })

  it("ignores zero line", () => {
    expect(
      buildEditorUri({
        editor: "cursor",
        projectRoot: "/home/user/project",
        relativePath: "src/index.ts",
        line: 0
      })
    ).toBe("cursor://file//home/user/project/src/index.ts")
  })

  it("ignores null line", () => {
    expect(
      buildEditorUri({
        editor: "cursor",
        projectRoot: "/home/user/project",
        relativePath: "src/index.ts",
        line: null,
        column: null
      })
    ).toBe("cursor://file//home/user/project/src/index.ts")
  })
})
