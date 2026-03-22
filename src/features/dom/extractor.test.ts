import { JSDOM } from "jsdom"
import { describe, expect, it } from "vitest"
import { extractIncidentFromDOM } from "./extractIncidentFromDOM"

function createDocument(html: string): Document {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`)
  return dom.window.document
}

function sentryTagRow(key: string, value: string, testId = "tag-tree-row") {
  return `
    <div data-test-id="${testId}" data-sentry-component="EventTagsTreeRow">
      <div data-sentry-element="TreeKeyTrunk">
        <span aria-hidden="true" data-sentry-element="TreeSearchKey">${key}</span>
        <div title="${key}" data-sentry-element="TreeKey">${key}</div>
      </div>
      <div data-sentry-element="TreeValueTrunk">
        <span>${value}</span>
      </div>
    </div>
  `
}

function sentryFrame(filename: string, fn: string) {
  return `
    <li data-test-id="line" class="frame system-frame">
      <div data-test-id="title">
        <code data-test-id="filename">${filename}</code>
        <code data-test-id="function">${fn}</code>
      </div>
    </li>
  `
}

describe("extractIncidentFromDOM", () => {
  describe("title extraction", () => {
    it("extracts error type + message from exception-value", () => {
      const doc = createDocument(`
        <div data-test-id="exception-value">
          <h5>QueryFailedError</h5>
          <pre>duplicate key value violates unique constraint "PK_abc123"</pre>
        </div>
      `)
      const result = extractIncidentFromDOM(doc)
      expect(result.title).toBe(
        'QueryFailedError: duplicate key value violates unique constraint "PK_abc123"'
      )
    })

    it("extracts error type only when no message present", () => {
      const doc = createDocument(`
        <div data-test-id="exception-value">
          <h5>TypeError</h5>
        </div>
      `)
      const result = extractIncidentFromDOM(doc)
      expect(result.title).toBe("TypeError")
    })

    it("extracts error message only when no type present", () => {
      const doc = createDocument(`
        <div data-test-id="exception-value">
          <pre>Cannot read properties of undefined (reading 'map')</pre>
        </div>
      `)
      const result = extractIncidentFromDOM(doc)
      expect(result.title).toBe(
        "Cannot read properties of undefined (reading 'map')"
      )
    })

    it("falls back to h1 when no exception-value exists", () => {
      const doc = createDocument("<h1>Internal Server Error</h1>")
      const result = extractIncidentFromDOM(doc)
      expect(result.title).toBe("Internal Server Error")
    })

    it("returns empty string when nothing found", () => {
      const doc = createDocument("<p>Nothing here</p>")
      const result = extractIncidentFromDOM(doc)
      expect(result.title).toBe("")
    })
  })

  describe("stack trace extraction", () => {
    it("extracts frames with filename and function", () => {
      const doc = createDocument(`
        <div data-test-id="stack-trace-content">
          <div data-test-id="frames">
            ${sentryFrame(
              "/app/node_modules/typeorm/driver/postgres/PostgresQueryRunner.js",
              "PostgresQueryRunner.query"
            )}
            ${sentryFrame(
              "node:internal/process/task_queues",
              "process.processTicksAndRejections"
            )}
            ${sentryFrame(
              "/app/node_modules/typeorm/data-source/DataSource.js",
              "DataSource.query"
            )}
          </div>
        </div>
      `)
      const result = extractIncidentFromDOM(doc)
      expect(result.stackTrace).toHaveLength(3)
      expect(result.stackTrace[0]).toBe(
        "/app/node_modules/typeorm/driver/postgres/PostgresQueryRunner.js in PostgresQueryRunner.query"
      )
      expect(result.stackTrace[1]).toBe(
        "node:internal/process/task_queues in process.processTicksAndRejections"
      )
    })

    it("extracts frame with filename only when function is missing", () => {
      const doc = createDocument(`
        <li data-test-id="line" class="frame">
          <div data-test-id="title">
            <code data-test-id="filename">src/services/order.ts</code>
          </div>
        </li>
      `)
      const result = extractIncidentFromDOM(doc)
      expect(result.stackTrace).toEqual(["src/services/order.ts"])
    })

    it("returns empty stack trace when no frames found", () => {
      const doc = createDocument("<p>No stack trace</p>")
      const result = extractIncidentFromDOM(doc)
      expect(result.stackTrace).toEqual([])
    })

    it("falls back to pre blocks with 'at' keyword", () => {
      const doc = createDocument(`
        <pre>Error: Something failed
 at UserService.find (src/services/user.ts:10:3)
 at processTicksAndRejections (node:internal/process/task_queues:95:5)</pre>
      `)
      const result = extractIncidentFromDOM(doc)
      expect(result.stackTrace.length).toBeGreaterThanOrEqual(2)
      expect(
        result.stackTrace.some((f) => f.includes("UserService.find"))
      ).toBe(true)
    })
  })

  describe("breadcrumbs extraction", () => {
    it("extracts breadcrumb entries from value-unformatted elements", () => {
      const doc = createDocument(`
        <div data-test-id="breadcrumbs">
          <div data-test-id="value-unformatted">QueryFailedError: duplicate key</div>
          <div data-test-id="value-unformatted">https://api.example.com/data [200]</div>
        </div>
      `)
      const result = extractIncidentFromDOM(doc)
      expect(result.breadcrumbs).toHaveLength(2)
      expect(result.breadcrumbs[0]).toContain("QueryFailedError")
      expect(result.breadcrumbs[1]).toContain("https://api.example.com")
    })

    it("returns empty breadcrumbs when container is missing", () => {
      const doc = createDocument("<p>No breadcrumbs</p>")
      const result = extractIncidentFromDOM(doc)
      expect(result.breadcrumbs).toEqual([])
    })
  })

  describe("tag extraction", () => {
    it("extracts environment from tag-tree-row", () => {
      const doc = createDocument(
        sentryTagRow("environment", "production")
      )
      const result = extractIncidentFromDOM(doc)
      expect(result.environment).toBe("production")
    })

    it("extracts release from tag-tree-row", () => {
      const doc = createDocument(sentryTagRow("release", "v2.3.1"))
      const result = extractIncidentFromDOM(doc)
      expect(result.release).toBe("v2.3.1")
    })

    it("extracts route from transaction tag", () => {
      const doc = createDocument(
        sentryTagRow("transaction", "POST /validate")
      )
      const result = extractIncidentFromDOM(doc)
      expect(result.route).toBe("POST /validate")
    })

    it("falls back to url tag for route", () => {
      const doc = createDocument(
        sentryTagRow("url", "/v3/app/vouchers/validate")
      )
      const result = extractIncidentFromDOM(doc)
      expect(result.route).toBe("/v3/app/vouchers/validate")
    })

    it("extracts values from highlight-tag-row", () => {
      const doc = createDocument(
        sentryTagRow("transaction", "POST /validate", "highlight-tag-row")
      )
      const result = extractIncidentFromDOM(doc)
      expect(result.route).toBe("POST /validate")
    })

    it("returns null for missing tags", () => {
      const doc = createDocument("<p>Nothing</p>")
      const result = extractIncidentFromDOM(doc)
      expect(result.environment).toBeNull()
      expect(result.release).toBeNull()
      expect(result.route).toBeNull()
    })

    it("extracts multiple tags into tags map", () => {
      const doc = createDocument(`
        ${sentryTagRow("environment", "production")}
        ${sentryTagRow("browser", "TourWhiteLabel 28")}
        ${sentryTagRow("os", "Alpine Linux 3.21.3")}
        ${sentryTagRow("runtime", "node v18.20.8")}
      `)
      const result = extractIncidentFromDOM(doc)
      expect(result.tags["environment"]).toBe("production")
      expect(result.tags["browser"]).toBe("TourWhiteLabel 28")
      expect(result.tags["os"]).toBe("Alpine Linux 3.21.3")
      expect(result.tags["runtime"]).toBe("node v18.20.8")
    })
  })

  describe("full page integration", () => {
    it("handles a realistic Sentry issue page", () => {
      const doc = createDocument(`
        <div data-test-id="exception-value">
          <h5>QueryFailedError</h5>
          <pre>duplicate key value violates unique constraint "PK_df6bf8f8d59fd7e324661b71487"</pre>
        </div>

        <div data-test-id="stack-trace-content">
          <div data-test-id="frames">
            ${sentryFrame(
              "/app/node_modules/typeorm/driver/postgres/PostgresQueryRunner.js",
              "PostgresQueryRunner.query"
            )}
            ${sentryFrame(
              "node:internal/process/task_queues",
              "process.processTicksAndRejections"
            )}
            ${sentryFrame(
              "/app/node_modules/typeorm/data-source/DataSource.js",
              "DataSource.query"
            )}
          </div>
        </div>

        <div data-test-id="breadcrumbs">
          <div data-test-id="value-unformatted">QueryFailedError: duplicate key value</div>
          <div data-test-id="value-unformatted">https://api.tinify.com/shrink [201]</div>
        </div>

        <div data-test-id="event-tags-tree">
          ${sentryTagRow("environment", "production")}
          ${sentryTagRow("transaction", "POST /validate")}
          ${sentryTagRow("url", "/v3/app/vouchers/validate")}
          ${sentryTagRow("runtime", "node v18.20.8")}
          ${sentryTagRow("server_name", "ip-172-31-20-157.ec2.internal")}
        </div>

        ${sentryTagRow("transaction", "POST /validate", "highlight-tag-row")}
        ${sentryTagRow("url", "/v3/app/vouchers/validate", "highlight-tag-row")}
      `)
      const result = extractIncidentFromDOM(doc)

      expect(result.title).toBe(
        'QueryFailedError: duplicate key value violates unique constraint "PK_df6bf8f8d59fd7e324661b71487"'
      )
      expect(result.stackTrace).toHaveLength(3)
      expect(result.stackTrace[0]).toContain("PostgresQueryRunner.query")
      expect(result.breadcrumbs).toHaveLength(2)
      expect(result.environment).toBe("production")
      expect(result.route).toBe("POST /validate")
      expect(result.tags["runtime"]).toBe("node v18.20.8")
      expect(result.tags["server_name"]).toBe(
        "ip-172-31-20-157.ec2.internal"
      )
    })
  })
})
