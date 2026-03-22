import type { TrainResult } from "../tfModel/trainTypes"

export interface RetrainProgress {
  epoch: number
  totalEpochs: number
  loss: number
  accuracy: number
}

export interface RetrainResult {
  success: boolean
  trainResult?: TrainResult
  totalExamples?: number
  feedbackCount?: number
  error?: string
}
