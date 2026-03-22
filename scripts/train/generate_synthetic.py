"""
Generate synthetic training data for the Stack Sift classifier.
Each example is a feature vector (64 floats) + a category label.
Generates varied examples for each category using randomized combinations.
"""

import json
import random
import sys
from pathlib import Path

from feature_names import CATEGORIES, FEATURE_NAMES

random.seed(42)

N_PER_CATEGORY = 300


def base_row() -> dict[str, float]:
    return {f: 0.0 for f in FEATURE_NAMES}


def rand_bool(p: float = 0.5) -> float:
    return 1.0 if random.random() < p else 0.0


def rand_stack_depth(low: int = 3, high: int = 20) -> float:
    return float(random.randint(low, high))


def rand_ratio() -> float:
    return round(random.uniform(0.1, 1.0), 2)


def common_api_context(row: dict[str, float]) -> None:
    row["isProduction"] = rand_bool(0.7)
    row["isStaging"] = 0.0 if row["isProduction"] else rand_bool(0.3)
    row["hasNodeRuntime"] = rand_bool(0.9)
    row["isServerOS"] = rand_bool(0.85)
    row["isHandled"] = rand_bool(0.6)
    row["hasStackTrace"] = rand_bool(0.9)
    row["hasFrameworkInStack"] = rand_bool(0.7)
    row["isAPIRoute"] = rand_bool(0.7)
    row["titleHasColon"] = rand_bool(0.6)
    row["hasHTTPBreadcrumbs"] = rand_bool(0.5)
    row["breadcrumbCount"] = float(random.randint(0, 30))
    row["titleWordCount"] = float(random.randint(2, 12))
    row["errorMessageLength"] = round(random.uniform(0.05, 0.8), 2)

    depth = rand_stack_depth()
    app_count = float(random.randint(1, int(depth)))
    row["stackDepth"] = depth
    row["appFrameCount"] = app_count
    row["appFrameRatio"] = round(app_count / depth, 2) if depth > 0 else 0.0

    method = random.choice(["GET", "POST", "PUT", "DELETE", None])
    if method == "GET":
        row["isGET"] = 1.0
    elif method == "POST":
        row["isPOST"] = 1.0
    elif method in ("PUT", "PATCH"):
        row["isPUTorPATCH"] = 1.0
    elif method == "DELETE":
        row["isDELETE"] = 1.0
    row["routeSegmentCount"] = float(random.randint(1, 6))

    row["isDocker"] = rand_bool(0.4)
    row["isLambda"] = rand_bool(0.1)
    row["isKubernetes"] = rand_bool(0.15)
    row["hasCloudProvider"] = rand_bool(0.5)


def gen_timeout() -> dict[str, float]:
    row = base_row()
    common_api_context(row)
    row["hasTimeoutTerms"] = 1.0
    row["isCustomError"] = rand_bool(0.3)
    row["isNativeError"] = 1.0 - row["isCustomError"]
    row["hasECONNREFUSED"] = rand_bool(0.3)
    row["hasECONNRESET"] = rand_bool(0.2)
    row["hasNodeErrorCode"] = rand_bool(0.7)
    row["hasHTTPClientInStack"] = rand_bool(0.4)
    row["hasDBDriverInStack"] = rand_bool(0.2)
    row["hasQueueInStack"] = rand_bool(0.1)
    row["hasMiddlewarePattern"] = rand_bool(0.3)
    row["hasServicePattern"] = rand_bool(0.4)
    row["topFrameIsVendor"] = rand_bool(0.5)
    row["hasCriticalRoute"] = rand_bool(0.2)
    row["hasHTTPStatus5xx"] = rand_bool(0.3)
    row["lastBreadcrumbIs5xx"] = rand_bool(0.2)
    return row


def gen_database() -> dict[str, float]:
    row = base_row()
    common_api_context(row)
    row["hasDatabaseTerms"] = 1.0
    row["isCustomError"] = rand_bool(0.8)
    row["isNativeError"] = 1.0 - row["isCustomError"]
    row["hasORMInStack"] = rand_bool(0.7)
    row["hasDBDriverInStack"] = rand_bool(0.6)
    row["hasDBQueryBreadcrumbs"] = rand_bool(0.4)
    row["topFrameIsVendor"] = rand_bool(0.6)
    row["hasServicePattern"] = rand_bool(0.5)
    row["hasRepositoryPattern"] = rand_bool(0.3)
    row["hasControllerPattern"] = rand_bool(0.3)
    row["hasNodeErrorCode"] = rand_bool(0.2)
    row["hasECONNREFUSED"] = rand_bool(0.1)
    row["hasCriticalRoute"] = rand_bool(0.2)
    return row


def gen_auth() -> dict[str, float]:
    row = base_row()
    common_api_context(row)
    row["hasAuthTerms"] = 1.0
    row["isCustomError"] = rand_bool(0.6)
    row["isNativeError"] = 1.0 - row["isCustomError"]
    row["hasAuthLibInStack"] = rand_bool(0.5)
    row["hasGuardPattern"] = rand_bool(0.3)
    row["hasMiddlewarePattern"] = rand_bool(0.4)
    row["hasHTTPStatus4xx"] = rand_bool(0.7)
    row["lastBreadcrumbIs4xx"] = rand_bool(0.3)
    row["hasCriticalRoute"] = rand_bool(0.5)
    row["hasControllerPattern"] = rand_bool(0.3)
    row["hasInterceptorPattern"] = rand_bool(0.1)
    return row


def gen_runtime() -> dict[str, float]:
    row = base_row()
    common_api_context(row)
    row["hasRuntimeErrorTerms"] = 1.0
    error_type = random.choice(["type", "reference", "range", "syntax"])
    row["isNativeError"] = 1.0
    if error_type == "type":
        row["isTypeError"] = 1.0
    elif error_type == "reference":
        row["isReferenceError"] = 1.0
    elif error_type == "range":
        row["isRangeError"] = 1.0
    elif error_type == "syntax":
        row["isSyntaxError"] = 1.0
    row["topFrameIsVendor"] = rand_bool(0.3)
    row["hasServicePattern"] = rand_bool(0.4)
    row["hasControllerPattern"] = rand_bool(0.3)
    row["hasMiddlewarePattern"] = rand_bool(0.2)
    return row


def gen_validation() -> dict[str, float]:
    row = base_row()
    common_api_context(row)
    row["hasValidationTerms"] = 1.0
    row["isCustomError"] = rand_bool(0.5)
    row["isNativeError"] = 1.0 - row["isCustomError"]
    row["hasValidatorInStack"] = rand_bool(0.6)
    row["hasHTTPStatus4xx"] = rand_bool(0.6)
    row["lastBreadcrumbIs4xx"] = rand_bool(0.2)
    row["hasMiddlewarePattern"] = rand_bool(0.3)
    row["hasControllerPattern"] = rand_bool(0.3)
    row["hasGuardPattern"] = rand_bool(0.1)
    row["hasInterceptorPattern"] = rand_bool(0.1)
    row["isPOST"] = rand_bool(0.5)
    return row


def gen_integration() -> dict[str, float]:
    row = base_row()
    common_api_context(row)
    row["hasIntegrationTerms"] = 1.0
    row["isCustomError"] = rand_bool(0.4)
    row["isNativeError"] = 1.0 - row["isCustomError"]
    row["hasHTTPClientInStack"] = rand_bool(0.7)
    row["hasENOTFOUND"] = rand_bool(0.3)
    row["hasECONNREFUSED"] = rand_bool(0.2)
    row["hasECONNRESET"] = rand_bool(0.2)
    row["hasHTTPStatus5xx"] = rand_bool(0.5)
    row["lastBreadcrumbIs5xx"] = rand_bool(0.3)
    row["hasNodeErrorCode"] = rand_bool(0.4)
    row["hasServicePattern"] = rand_bool(0.4)
    row["topFrameIsVendor"] = rand_bool(0.5)
    return row


def gen_infra() -> dict[str, float]:
    row = base_row()
    common_api_context(row)
    row["hasInfraTerms"] = 1.0
    row["isNativeError"] = rand_bool(0.5)
    row["isCustomError"] = 1.0 - row["isNativeError"]
    row["hasNodeErrorCode"] = rand_bool(0.5)
    row["hasENOENT"] = rand_bool(0.2)
    row["hasEACCES"] = rand_bool(0.2)
    row["topFrameIsVendor"] = rand_bool(0.4)
    row["isDocker"] = rand_bool(0.6)
    row["isKubernetes"] = rand_bool(0.3)
    row["hasCloudProvider"] = rand_bool(0.6)
    row["isLambda"] = rand_bool(0.2)
    return row


def gen_unknown() -> dict[str, float]:
    row = base_row()
    common_api_context(row)
    row["isCustomError"] = rand_bool(0.5)
    row["isNativeError"] = rand_bool(0.3)
    row["topFrameIsVendor"] = rand_bool(0.5)
    row["hasServicePattern"] = rand_bool(0.3)
    row["hasControllerPattern"] = rand_bool(0.2)
    return row


GENERATORS = {
    "timeout": gen_timeout,
    "database": gen_database,
    "auth": gen_auth,
    "runtime": gen_runtime,
    "validation": gen_validation,
    "integration": gen_integration,
    "infra": gen_infra,
    "unknown": gen_unknown,
}


def add_noise(row: dict[str, float], noise_rate: float = 0.05) -> None:
    """Randomly flip some boolean features to add variety."""
    bool_features = [f for f in FEATURE_NAMES if f not in (
        "stackDepth", "appFrameCount", "appFrameRatio",
        "routeSegmentCount", "breadcrumbCount",
        "titleWordCount", "errorMessageLength"
    )]
    for f in bool_features:
        if random.random() < noise_rate:
            row[f] = 1.0 - row[f]


def main() -> None:
    output_path = Path(__file__).parent / "synthetic_data.json"

    data = []
    for category in CATEGORIES:
        gen = GENERATORS[category]
        for _ in range(N_PER_CATEGORY):
            row = gen()
            add_noise(row)
            features = [row[f] for f in FEATURE_NAMES]
            data.append({"features": features, "category": category})

    random.shuffle(data)

    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Generated {len(data)} examples ({N_PER_CATEGORY} per category)")
    print(f"Categories: {CATEGORIES}")
    print(f"Features per example: {len(FEATURE_NAMES)}")
    print(f"Output: {output_path}")


if __name__ == "__main__":
    main()
