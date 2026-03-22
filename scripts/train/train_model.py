"""
Train a Random Forest classifier on synthetic + real feedback data.
Exports to ONNX for browser-side inference via ONNX Runtime Web.

Usage:
  python train_model.py                          # synthetic only
  python train_model.py --feedback feedback.json  # synthetic + real data
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

from feature_names import CATEGORIES, FEATURE_NAMES

MODEL_OUTPUT = Path(__file__).parent.parent.parent / "assets" / "model.onnx"


def load_synthetic(path: Path) -> tuple[np.ndarray, np.ndarray]:
    with open(path) as f:
        data = json.load(f)

    X = np.array([d["features"] for d in data], dtype=np.float32)
    y = np.array([CATEGORIES.index(d["category"]) for d in data], dtype=np.int64)
    return X, y


def load_feedback(path: Path) -> tuple[np.ndarray, np.ndarray]:
    """
    Load real user feedback exported from the extension.
    Expected format: array of objects with { features: MLFeatures, correctedCategory: string }
    where MLFeatures has the same field names as FEATURE_NAMES.
    """
    with open(path) as f:
        data = json.load(f)

    if len(data) == 0:
        return np.empty((0, len(FEATURE_NAMES)), dtype=np.float32), np.empty(0, dtype=np.int64)

    rows = []
    labels = []
    for item in data:
        feats = item.get("features", {})
        cat = item.get("correctedCategory", "unknown")
        if cat not in CATEGORIES:
            cat = "unknown"

        row = []
        for fname in FEATURE_NAMES:
            val = feats.get(fname, 0.0)
            if isinstance(val, bool):
                val = 1.0 if val else 0.0
            row.append(float(val))

        rows.append(row)
        labels.append(CATEGORIES.index(cat))

    return np.array(rows, dtype=np.float32), np.array(labels, dtype=np.int64)


def train(X: np.ndarray, y: np.ndarray) -> RandomForestClassifier:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_leaf=5,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print("\n--- Classification Report ---")
    print(classification_report(y_test, y_pred, target_names=CATEGORIES, digits=3))

    return clf


def export_onnx(clf: RandomForestClassifier) -> None:
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import FloatTensorType

    initial_types = [("input", FloatTensorType([None, len(FEATURE_NAMES)]))]
    onnx_model = convert_sklearn(
        clf,
        initial_types=initial_types,
        target_opset=15,
        options={type(clf): {"zipmap": False}},
    )

    MODEL_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(MODEL_OUTPUT, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"\nModel exported to {MODEL_OUTPUT}")
    print(f"Size: {MODEL_OUTPUT.stat().st_size / 1024:.1f} KB")


def verify_onnx() -> None:
    import onnxruntime as ort

    session = ort.InferenceSession(str(MODEL_OUTPUT))
    dummy = np.zeros((1, len(FEATURE_NAMES)), dtype=np.float32)
    result = session.run(None, {"input": dummy})

    print(f"\nONNX verification:")
    print(f"  Input shape: {dummy.shape}")
    print(f"  Output label shape: {result[0].shape}")
    print(f"  Output probabilities shape: {result[1].shape}")
    print(f"  Categories: {CATEGORIES}")
    print(f"  Prediction for zeros: {CATEGORIES[result[0][0]]}")
    print(f"  Probabilities: {[f'{p:.3f}' for p in result[1][0]]}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train Stack Sift classifier")
    parser.add_argument(
        "--feedback", type=Path, default=None,
        help="Path to real feedback JSON exported from the extension"
    )
    args = parser.parse_args()

    synthetic_path = Path(__file__).parent / "synthetic_data.json"
    if not synthetic_path.exists():
        print("Synthetic data not found. Run generate_synthetic.py first.")
        sys.exit(1)

    X, y = load_synthetic(synthetic_path)
    print(f"Loaded {len(X)} synthetic examples")

    if args.feedback and args.feedback.exists():
        X_fb, y_fb = load_feedback(args.feedback)
        if len(X_fb) > 0:
            weight_factor = 3
            X_fb_weighted = np.repeat(X_fb, weight_factor, axis=0)
            y_fb_weighted = np.repeat(y_fb, weight_factor, axis=0)
            X = np.concatenate([X, X_fb_weighted])
            y = np.concatenate([y, y_fb_weighted])
            print(f"Added {len(X_fb)} real feedback examples (weighted {weight_factor}x)")
    elif args.feedback:
        print(f"Warning: feedback file {args.feedback} not found, using synthetic only")

    print(f"Total training examples: {len(X)}")
    print(f"Features: {len(FEATURE_NAMES)}")

    clf = train(X, y)
    export_onnx(clf)
    verify_onnx()

    print("\nDone! Copy assets/model.onnx to your extension build.")


if __name__ == "__main__":
    main()
