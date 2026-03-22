import { parseFrame } from "~/features/editor/frameParser/parseFrame"
import { mapToSourcePath } from "~/features/editor/pathMapper/mapToSourcePath"

export function FrameLabel({ frame }: { frame: string }) {
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
