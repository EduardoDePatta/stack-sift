import type { ReactNode } from "react"

interface SidebarSectionProps {
  title: string
  children: ReactNode
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="ss-section">
      <div className="ss-section-title">{title}</div>
      <div className="ss-section-content">{children}</div>
    </div>
  )
}
