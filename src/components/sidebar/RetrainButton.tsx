import { useCallback, useEffect, useState } from "react"
import { getFeedbackCount } from "~/features/feedback/storage"
import {
  retrainWithFeedback,
  type RetrainProgress
} from "~/features/ml/retrain"

export function RetrainButton() {
  const [count, setCount] = useState(0)
  const [status, setStatus] = useState<
    "idle" | "training" | "done" | "trained" | "error"
  >("idle")
  const [progress, setProgress] = useState<RetrainProgress | null>(null)
  const [resultMsg, setResultMsg] = useState("")
  const [trainedCount, setTrainedCount] = useState(0)

  useEffect(() => {
    getFeedbackCount().then(setCount).catch(() => setCount(0))
  }, [])

  const handleRetrain = useCallback(async () => {
    setStatus("training")
    setProgress(null)

    const result = await retrainWithFeedback((p) => setProgress(p))

    if (result.success && result.trainResult) {
      const acc = Math.round(result.trainResult.finalAccuracy * 100)
      const fbCount = result.feedbackCount ?? 0
      setResultMsg(`Accuracy: ${acc}%`)
      setTrainedCount(fbCount)
      setStatus("done")
      setTimeout(() => setStatus("trained"), 3000)
    } else {
      setResultMsg(result.error ?? "Erro desconhecido")
      setStatus("error")
      setTimeout(() => setStatus("idle"), 4000)
    }
  }, [])

  if (count === 0 && status === "idle") return null

  if (status === "training") {
    return (
      <div className="ss-retrain">
        <div className="ss-retrain-progress">
          Treinando...{" "}
          {progress && (
            <span>
              Epoch {progress.epoch}/{progress.totalEpochs} — Loss:{" "}
              {progress.loss.toFixed(3)}
            </span>
          )}
        </div>
        <div className="ss-retrain-bar">
          <div
            className="ss-retrain-bar-fill"
            style={{
              width: progress
                ? `${(progress.epoch / progress.totalEpochs) * 100}%`
                : "0%"
            }}
          />
        </div>
      </div>
    )
  }

  if (status === "done") {
    return (
      <div className="ss-retrain">
        <span className="ss-retrain-done">Modelo atualizado! {resultMsg}</span>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="ss-retrain">
        <span className="ss-retrain-error">{resultMsg}</span>
      </div>
    )
  }

  const hasNewFeedbacks = count > trainedCount

  if (status === "trained" && !hasNewFeedbacks) {
    return (
      <div className="ss-retrain">
        <div className="ss-retrain-trained">
          Modelo treinado com {trainedCount} feedback{trainedCount > 1 ? "s" : ""}. {resultMsg}
        </div>
        <button
          className="ss-retrain-btn ss-retrain-btn-secondary"
          onClick={handleRetrain}>
          Retreinar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="ss-retrain">
      {trainedCount > 0 && (
        <div className="ss-retrain-trained">
          Modelo treinado com {trainedCount} feedback{trainedCount > 1 ? "s" : ""}.{" "}
          {count - trainedCount} novo{count - trainedCount > 1 ? "s" : ""} disponivel{count - trainedCount > 1 ? "is" : ""}.
        </div>
      )}
      <button className="ss-retrain-btn" onClick={handleRetrain}>
        {trainedCount > 0
          ? `Retreinar com ${count} feedbacks`
          : `Treinar modelo (${count} feedback${count > 1 ? "s" : ""})`}
      </button>
    </div>
  )
}
