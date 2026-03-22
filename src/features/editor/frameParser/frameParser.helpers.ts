export function extractPathAndNumbers(raw: string): {
  filePath: string
  line: number | null
  column: number | null
} {
  const match = raw.match(/^(.+?):(\d+)(?::(\d+))?$/)
  if (match) {
    return {
      filePath: match[1],
      line: parseInt(match[2], 10),
      column: match[3] ? parseInt(match[3], 10) : null
    }
  }
  return { filePath: raw, line: null, column: null }
}
