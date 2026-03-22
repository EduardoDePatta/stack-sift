import { useState } from "react"
import type { IncidentCategory } from "~/shared/types/incident"
import { ALL_FEEDBACK_CATEGORIES } from "./constants"

export function FeedbackPanel({
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
        {ALL_FEEDBACK_CATEGORIES.filter((c) => c !== currentCategory).map((cat) => (
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
