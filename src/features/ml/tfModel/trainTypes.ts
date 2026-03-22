export interface TrainOptions {
  epochs?: number
  batchSize?: number
  validationSplit?: number
  onEpochEnd?: (epoch: number, logs: { loss: number; acc: number }) => void
}

export interface TrainResult {
  finalLoss: number
  finalAccuracy: number
  epochs: number
}
