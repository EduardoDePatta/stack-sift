# Stack Sift

A Chrome/Edge extension that provides intelligent incident triage directly on Sentry issue pages. Runs **100% locally** in the browser — no backend, no external APIs, no cloud inference.

## Features

- **Automatic classification** of errors into 8 categories: timeout, database, auth, runtime, validation, integration, infra, unknown
- **In-browser ML** — trains and runs a neural network (TensorFlow.js MLP) entirely in the browser
- **Adaptive learning** — learns from your corrections via text-similarity kNN + retrainable MLP
- **Actionable recommendations** — pattern-matched suggestions specific to each error type
- **Priority scoring** based on error category, environment, and route sensitivity
- **Open in editor** — jump from Sentry to the exact source file in VS Code or Cursor
- **Smart stack frame analysis** — skips error handlers and boilerplate, shows all navigable in-app frames
- **64-feature extraction** — error type, Node.js error codes, stack structure, architectural patterns, route/HTTP, breadcrumbs, infra context, text metrics

## How It Works

When you open a Sentry issue page, Stack Sift:

1. **Extracts** error data from the DOM (title, stack trace, breadcrumbs, environment, tags)
2. **Builds 64 features** from the extracted data
3. **Classifies** the incident using a multi-layer pipeline:
   - Heuristic classifier (regex/keyword patterns)
   - TensorFlow.js MLP (trained in-browser with synthetic + user feedback data)
   - Adaptive kNN classifier (learns from user corrections via cosine text similarity)
   - Merge logic that combines all signals with confidence weighting
4. **Generates insights** — summary, recommendations, priority, stack frames
5. **Renders a sidebar** injected into the Sentry page

### Learning System

Stack Sift gets smarter as you use it:

- **Exact match memory** — corrections for identical errors are remembered with 100% confidence
- **Text similarity** — corrections influence similar errors via kNN with cosine similarity
- **Retrain button** — click to retrain the MLP with your accumulated feedback (takes ~2 seconds)
- **All data stays local** — feedback in `chrome.storage.local`, model in IndexedDB

### ML Pipeline

The classification model is a 3-layer MLP (64 → 32 → 16 → 8) that:

- Ships with 2400 synthetic training examples embedded in the bundle
- Can be trained/retrained entirely in the browser via TensorFlow.js
- Weights user feedback 3x more than synthetic data during retraining
- Persists the trained model in IndexedDB across sessions

## Getting Started

```bash
npm install
npm run dev
```

Load the extension in Chrome/Edge:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `build/chrome-mv3-dev` folder

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
npm run test:watch
```

## Tech Stack

| Technology | Purpose |
|---|---|
| [Plasmo](https://docs.plasmo.com/) | Browser extension framework |
| React | Sidebar UI |
| TypeScript (strict) | Type safety across the project |
| [TensorFlow.js](https://www.tensorflow.org/js) | In-browser ML training and inference |
| Vitest + jsdom | Testing with DOM mocking |

## Project Structure

```
src/
  features/
    dom/                  # DOM extraction from Sentry pages
    classification/       # Rule-based heuristic classifier
    insights/             # Summary, recommendations, priority, useful frames
    ml/
      buildFeatures/      # 64-feature extraction from ParsedIncident
      runInference/       # TF.js inference + mock fallback
      tfModel/            # MLP architecture, training, prediction
      retrain/            # In-browser retraining orchestration
      modelLoader/        # Model loading from IndexedDB
      data/               # Synthetic training data, feature keys
    feedback/
      storage/            # Feedback CRUD in chrome.storage.local
      adaptiveClassifier/ # kNN classifier with text similarity
      textSimilarity/     # Tokenization, TF vectors, cosine similarity
    editor/               # Open-in-editor: frame parsing, path mapping, URIs
    sentry/               # Orchestration + Sentry page detection
  shared/
    types/                # Shared TypeScript interfaces
  components/
    sidebar/              # Sidebar UI components
  contents/               # Plasmo content script entry + CSS
```

## Architecture

```
Sentry DOM ──► Extractor ──► ParsedIncident
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼               ▼
               Heuristic     TF.js MLP       Adaptive kNN
               Classifier   (in-browser)    (user feedback)
                    │              │               │
                    └──────┬───────┘───────────────┘
                           ▼
                    Merge Classification
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          Summary    Recommendations  Priority
              │            │            │
              └────────────┼────────────┘
                           ▼
                       Sidebar UI
                     ┌─────┴─────┐
                     ▼           ▼
               Retrain btn   Open in editor
```

## Classification Categories

| Category | Signals |
|---|---|
| timeout | `etimedout`, `socket hang up`, `deadline exceeded`, `connect timeout` |
| database | `queryfailederror`, `prisma`, `duplicate key`, `deadlock`, `typeorm` |
| auth | `unauthorized`, `jwt expired`, `token invalid`, `forbidden`, `403` |
| runtime | `cannot read properties of undefined`, `typeerror`, `referenceerror` |
| validation | `zod`, `schema`, `invalid payload`, `class-validator`, `400` |
| integration | `econnrefused`, `fetch failed`, `502`, `503`, `bad gateway` |
| infra | `out of memory`, `enospc`, `sigkill`, `oom`, `enomem` |
| unknown | No matching signals |

## Feature Categories (64 total)

| Group | Count | Examples |
|---|---|---|
| Keyword booleans | 11 | hasTimeoutTerms, hasDatabaseTerms, isProduction |
| Error type | 6 | isTypeError, isRangeError, isCustomError |
| Node.js error codes | 8 | hasECONNREFUSED, hasENOENT, hasHTTPStatus5xx |
| Stack trace structural | 11 | stackDepth, appFrameRatio, hasORMInStack |
| Architectural patterns | 7 | hasControllerPattern, hasServicePattern |
| Route / HTTP | 6 | isGET, isPOST, isAPIRoute, routeSegmentCount |
| Breadcrumbs | 5 | breadcrumbCount, hasDBQueryBreadcrumbs |
| Context / infra | 6 | isDocker, isLambda, hasCloudProvider |
| Text metrics | 4 | titleWordCount, hasStackTrace, errorMessageLength |

## Chrome Web Store

- **Icon:** `assets/icon.png` (Plasmo generates toolbar/store icon sizes from it).
- **Privacy policy (draft):** [docs/privacy-policy.html](./docs/privacy-policy.html) — publish it at a public HTTPS URL before submitting the listing.
- **Checklist:** [docs/WEBSTORE.md](./docs/WEBSTORE.md) (ZIP via `npm run package`, screenshots, dashboard fields).

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run the tests (`npm test`)
5. Commit (`git commit -m "Add my feature"`)
6. Push (`git push origin feature/my-feature`)
7. Open a Pull Request

If you're unsure about something, open an issue first to discuss it.

## License

[MIT](./LICENSE)
