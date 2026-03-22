# Stack Sift

A Chrome/Edge extension that provides intelligent incident triage directly on Sentry issue pages. Runs **100% locally** in the browser — no backend, no external APIs, no cloud inference.

## Features

- **Automatic classification** of errors into 8 categories: timeout, database, auth, frontend-runtime, validation, integration, infra, unknown
- **Actionable recommendations** with pattern-matched suggestions specific to each error
- **Adaptive learning** — learns from your corrections using text-similarity-based kNN
- **Priority scoring** based on error category, environment, and route sensitivity
- **Open in editor** — jump from Sentry to the exact source file in VS Code or Cursor
- **Smart stack frame analysis** — skips error handlers and boilerplate, shows all navigable in-app frames

## How It Works

When you open a Sentry issue page, Stack Sift:

1. **Extracts** error data from the DOM (title, stack trace, breadcrumbs, environment, release, route, tags)
2. **Classifies** the incident using a multi-layer pipeline:
   - Heuristic classifier (regex/keyword patterns)
   - Adaptive kNN classifier (learns from user feedback via cosine text similarity)
   - ML layer (ONNX Runtime Web — architecture ready, model placeholder)
   - Merge logic that combines all signals with confidence weighting
3. **Generates insights** — summary, recommendations, priority, stack frames
4. **Renders a sidebar** injected into the Sentry page

### Learning System

Stack Sift gets smarter as you use it:

- **Exact match memory** — corrections for identical errors are remembered with 100% confidence
- **Text similarity** — corrections influence similar errors. A `QueryFailedError: duplicate key` correction will help classify a `QueryFailedError: deadlock detected` too
- **All data stays local** in `chrome.storage.local`

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
npm run test:watch  # watch mode
```

## Tech Stack

| Technology | Purpose |
|---|---|
| [Plasmo](https://docs.plasmo.com/) | Browser extension framework |
| React | Sidebar UI |
| TypeScript (strict) | Type safety across the project |
| Vitest + jsdom | Testing with DOM mocking |
| ONNX Runtime Web | ML inference layer (architecture ready) |

## Project Structure

```
src/
  features/
    dom/              # DOM extraction from Sentry pages
    classification/   # Rule-based heuristic classifier
    insights/         # Summary, recommendations, priority, useful frames
    ml/               # ML pipeline: features, inference, model loading, merge
    feedback/         # User feedback storage, adaptive kNN, text similarity
    editor/           # Open-in-editor: frame parsing, path mapping, URI building
    sentry/           # Orchestration + Sentry page detection
  shared/
    types/            # Shared TypeScript interfaces
  components/         # React UI components (Sidebar, SidebarSection)
  contents/           # Plasmo content script entry + CSS
```

## Architecture

```
Sentry DOM ──► Extractor ──► ParsedIncident
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼               ▼
               Heuristic     ML Inference    Adaptive kNN
               Classifier   (ONNX/mock)     (user feedback)
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
```

### Module Boundaries

| Module | Responsibility | Restrictions |
|---|---|---|
| `features/dom` | DOM reading and extraction | No classification, no React |
| `features/classification` | Rule-based classification | No DOM access, no React |
| `features/insights` | Summary, recommendations, priority, frames | No DOM, no React |
| `features/ml` | Feature engineering, inference, merging | No DOM, no React |
| `features/feedback` | Storage, adaptive classifier, text similarity | No DOM, no React |
| `features/editor` | Frame parsing, path mapping, editor URIs | No DOM, no React |
| `features/sentry` | Orchestration between all modules | Glue layer |
| `components/` | Pure UI rendering | No business logic |

## Classification Categories

| Category | Signals |
|---|---|
| timeout | `etimedout`, `socket hang up`, `deadline exceeded`, `connect timeout` |
| database | `queryfailederror`, `prisma`, `duplicate key`, `deadlock`, `typeorm` |
| auth | `unauthorized`, `jwt expired`, `token invalid`, `forbidden`, `403` |
| frontend-runtime | `cannot read properties of undefined`, `typeerror`, `referenceerror` |
| validation | `zod`, `schema`, `invalid payload`, `class-validator` |
| integration | `axios`, `fetch failed`, `econnrefused`, `502`, `503` |
| infra | `out of memory`, `heap`, `enospc`, `sigkill`, `disk full` |
| unknown | No matching signals |

## License

[MIT](./LICENSE)
