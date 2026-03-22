import { resolve } from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    globals: true
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "src")
    }
  }
})
