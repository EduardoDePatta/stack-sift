import { describe, expect, it } from "vitest"
import { createModel } from "./tfModel/createModel"
import { predict } from "./tfModel/predict"
import { trainModel } from "./tfModel/trainModel"

describe("tfModel", () => {
  it("creates a model with correct input/output shapes", () => {
    const model = createModel()
    expect(model.inputs[0].shape).toEqual([null, 64])
    expect(model.outputs[0].shape).toEqual([null, 8])
    model.dispose()
  })

  it("predicts without training (random weights)", () => {
    const model = createModel()
    const features = new Array(64).fill(0)
    const result = predict(model, features)

    expect(result.probabilities.length).toBe(8)
    expect(result.predictedIndex).toBeGreaterThanOrEqual(0)
    expect(result.predictedIndex).toBeLessThan(8)

    const sum = result.probabilities.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 1)
    model.dispose()
  })

  it("trains on small data and reduces loss", async () => {
    const model = createModel()

    const xData = [
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 3, 0.6, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 5, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 3, 0, 1, 0.2],
      [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 8, 5, 0.6, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 4, 3, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 4, 1, 1, 0.3],
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 6, 4, 0.7, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0.15],
    ]
    const yData = [0, 1, 2]

    const result = await trainModel(model, xData, yData, {
      epochs: 10,
      batchSize: 3,
      validationSplit: 0
    })

    expect(result.epochs).toBe(10)
    expect(result.finalLoss).toBeLessThan(5)
    expect(typeof result.finalAccuracy).toBe("number")
    model.dispose()
  })

  it("predict returns consistent results for same input", () => {
    const model = createModel()
    const features = new Array(64).fill(0.5)
    const r1 = predict(model, features)
    const r2 = predict(model, features)

    expect(r1.predictedIndex).toBe(r2.predictedIndex)
    for (let i = 0; i < 8; i++) {
      expect(r1.probabilities[i]).toBeCloseTo(r2.probabilities[i], 5)
    }
    model.dispose()
  })
})
