import { describe, expect, it } from "vitest"
import type { ParsedIncident } from "~/shared/types/incident"
import { buildFeatures } from "./buildFeatures"

function makeIncident(overrides: Partial<ParsedIncident> = {}): ParsedIncident {
  return {
    title: "",
    stackTrace: [],
    breadcrumbs: [],
    environment: null,
    release: null,
    route: null,
    tags: {},
    ...overrides
  }
}

describe("buildFeatures", () => {
  describe("text fields", () => {
    it("builds concatenatedText from all fields", () => {
      const features = buildFeatures(
        makeIncident({
          title: "Error: Timeout",
          stackTrace: ["at handler (src/api.ts:10)"],
          breadcrumbs: ["HTTP GET /api"],
          tags: { browser: "Chrome" }
        })
      )
      expect(features.concatenatedText).toContain("error: timeout")
      expect(features.concatenatedText).toContain("at handler")
      expect(features.concatenatedText).toContain("http get /api")
      expect(features.concatenatedText).toContain("chrome")
    })

    it("lowercases all text fields", () => {
      const features = buildFeatures(
        makeIncident({ title: "TYPEERROR: Something" })
      )
      expect(features.titleText).toBe("typeerror: something")
    })

    it("handles empty incident gracefully", () => {
      const features = buildFeatures(makeIncident())
      expect(features.concatenatedText).toBe("")
      expect(features.titleText).toBe("")
      expect(features.stackText).toBe("")
      expect(features.tagText).toBe("")
    })
  })

  describe("boolean flags", () => {
    it("detects timeout terms", () => {
      const features = buildFeatures(
        makeIncident({ title: "Error: ETIMEDOUT - request timed out" })
      )
      expect(features.hasTimeoutTerms).toBe(true)
      expect(features.hasDatabaseTerms).toBe(false)
    })

    it("detects database terms", () => {
      const features = buildFeatures(
        makeIncident({
          title: "QueryFailedError: duplicate key constraint"
        })
      )
      expect(features.hasDatabaseTerms).toBe(true)
      expect(features.hasTimeoutTerms).toBe(false)
    })

    it("detects auth terms", () => {
      const features = buildFeatures(
        makeIncident({ title: "Error: Unauthorized - JWT expired" })
      )
      expect(features.hasAuthTerms).toBe(true)
    })

    it("detects runtime error terms", () => {
      const features = buildFeatures(
        makeIncident({
          title: "TypeError: Cannot read properties of undefined"
        })
      )
      expect(features.hasRuntimeErrorTerms).toBe(true)
    })

    it("detects validation terms", () => {
      const features = buildFeatures(
        makeIncident({ title: "ZodError: Validation failed" })
      )
      expect(features.hasValidationTerms).toBe(true)
    })

    it("detects terms in stack trace, not just title", () => {
      const features = buildFeatures(
        makeIncident({
          title: "Internal Server Error",
          stackTrace: ["at PrismaClient._request (node_modules/.prisma)"]
        })
      )
      expect(features.hasDatabaseTerms).toBe(true)
    })

    it("detects terms in tags", () => {
      const features = buildFeatures(
        makeIncident({
          title: "Server Error",
          tags: { error_detail: "SQL query failed" }
        })
      )
      expect(features.hasDatabaseTerms).toBe(true)
    })

    it("returns all false for unrecognizable errors", () => {
      const features = buildFeatures(
        makeIncident({ title: "Error: Something unexpected" })
      )
      expect(features.hasTimeoutTerms).toBe(false)
      expect(features.hasDatabaseTerms).toBe(false)
      expect(features.hasAuthTerms).toBe(false)
      expect(features.hasRuntimeErrorTerms).toBe(false)
      expect(features.hasValidationTerms).toBe(false)
    })
  })

  describe("environment and route", () => {
    it("detects production environment", () => {
      const features = buildFeatures(
        makeIncident({ environment: "production" })
      )
      expect(features.isProduction).toBe(true)
    })

    it("detects prod as production", () => {
      const features = buildFeatures(
        makeIncident({ environment: "prod" })
      )
      expect(features.isProduction).toBe(true)
    })

    it("returns false for non-production", () => {
      const features = buildFeatures(
        makeIncident({ environment: "staging" })
      )
      expect(features.isProduction).toBe(false)
    })

    it("returns false for null environment", () => {
      const features = buildFeatures(makeIncident())
      expect(features.isProduction).toBe(false)
    })

    it("detects critical route from transaction", () => {
      const features = buildFeatures(
        makeIncident({ route: "POST /api/payment/process" })
      )
      expect(features.hasCriticalRoute).toBe(true)
    })

    it("detects critical route from url tag", () => {
      const features = buildFeatures(
        makeIncident({
          route: "POST /check-email",
          tags: { url: "/v3/app/auth/check-email" }
        })
      )
      expect(features.hasCriticalRoute).toBe(true)
    })

    it("returns false for non-critical route", () => {
      const features = buildFeatures(
        makeIncident({ route: "GET /api/reports" })
      )
      expect(features.hasCriticalRoute).toBe(false)
    })

    it("returns false when route is null", () => {
      const features = buildFeatures(makeIncident())
      expect(features.hasCriticalRoute).toBe(false)
    })
  })

  describe("A. error type detection", () => {
    it("detects TypeError", () => {
      const features = buildFeatures(
        makeIncident({ title: "TypeError: Cannot read property 'length' of undefined" })
      )
      expect(features.isTypeError).toBe(true)
      expect(features.isRangeError).toBe(false)
      expect(features.isCustomError).toBe(false)
    })

    it("detects RangeError", () => {
      const features = buildFeatures(
        makeIncident({ title: "RangeError: Maximum call stack size exceeded" })
      )
      expect(features.isRangeError).toBe(true)
      expect(features.isTypeError).toBe(false)
    })

    it("detects custom error classes", () => {
      const features = buildFeatures(
        makeIncident({ title: "QueryFailedError: relation does not exist" })
      )
      expect(features.isCustomError).toBe(true)
      expect(features.isNativeError).toBe(false)
      expect(features.isTypeError).toBe(false)
    })

    it("marks native errors correctly", () => {
      const typeErr = buildFeatures(
        makeIncident({ title: "TypeError: x is not a function" })
      )
      expect(typeErr.isNativeError).toBe(true)

      const customErr = buildFeatures(
        makeIncident({ title: "QueryFailedError: something broke" })
      )
      expect(customErr.isNativeError).toBe(false)
    })
  })

  describe("B. Node.js error codes", () => {
    it("detects ECONNREFUSED", () => {
      const features = buildFeatures(
        makeIncident({ title: "Error: connect ECONNREFUSED 127.0.0.1:5432" })
      )
      expect(features.hasECONNREFUSED).toBe(true)
      expect(features.hasECONNRESET).toBe(false)
    })

    it("detects ECONNRESET", () => {
      const features = buildFeatures(
        makeIncident({ title: "Error: read ECONNRESET" })
      )
      expect(features.hasECONNRESET).toBe(true)
      expect(features.hasECONNREFUSED).toBe(false)
    })

    it("detects ENOENT", () => {
      const features = buildFeatures(
        makeIncident({ title: "Error: ENOENT: no such file or directory" })
      )
      expect(features.hasENOENT).toBe(true)
    })

    it("detects HTTP 4xx status codes", () => {
      const features = buildFeatures(
        makeIncident({ title: "Request failed with status code 404" })
      )
      expect(features.hasHTTPStatus4xx).toBe(true)
      expect(features.hasHTTPStatus5xx).toBe(false)
    })

    it("detects HTTP 5xx status codes", () => {
      const features = buildFeatures(
        makeIncident({ title: "Request failed with status code 500" })
      )
      expect(features.hasHTTPStatus5xx).toBe(true)
      expect(features.hasHTTPStatus4xx).toBe(false)
    })
  })

  describe("C. stack trace structural", () => {
    it("counts stack depth", () => {
      const features = buildFeatures(
        makeIncident({
          stackTrace: [
            "at handler (src/api.ts:10)",
            "at processRequest (src/server.ts:42)",
            "at Layer.handle (node_modules/express/lib/router/layer.js:95)"
          ]
        })
      )
      expect(features.stackDepth).toBe(3)
    })

    it("counts app frames excluding vendor frames", () => {
      const features = buildFeatures(
        makeIncident({
          stackTrace: [
            "at handler (src/api.ts:10)",
            "at processRequest (src/server.ts:42)",
            "at Layer.handle (node_modules/express/lib/router/layer.js:95)",
            "at next (node_modules/express/lib/router/route.js:137)"
          ]
        })
      )
      expect(features.appFrameCount).toBe(2)
      expect(features.stackDepth).toBe(4)
    })

    it("calculates appFrameRatio correctly", () => {
      const features = buildFeatures(
        makeIncident({
          stackTrace: [
            "at handler (src/api.ts:10)",
            "at Layer.handle (node_modules/express/lib/router/layer.js:95)",
            "at process (src/core.ts:20)",
            "at Route.dispatch (node_modules/express/lib/router/route.js:112)"
          ]
        })
      )
      expect(features.appFrameRatio).toBe(0.5)
    })

    it("detects top frame as vendor", () => {
      const features = buildFeatures(
        makeIncident({
          stackTrace: [
            "at Layer.handle (node_modules/express/lib/router/layer.js:95)",
            "at handler (src/api.ts:10)"
          ]
        })
      )
      expect(features.topFrameIsVendor).toBe(true)

      const appFirst = buildFeatures(
        makeIncident({
          stackTrace: [
            "at handler (src/api.ts:10)",
            "at Layer.handle (node_modules/express/lib/router/layer.js:95)"
          ]
        })
      )
      expect(appFirst.topFrameIsVendor).toBe(false)
    })

    it("detects ORM libraries in stack", () => {
      for (const lib of ["typeorm", "prisma", "sequelize"]) {
        const features = buildFeatures(
          makeIncident({
            stackTrace: [`at QueryRunner.execute (node_modules/${lib}/src/query.js:42)`]
          })
        )
        expect(features.hasORMInStack).toBe(true)
      }
    })

    it("detects DB drivers in stack", () => {
      const pgFeatures = buildFeatures(
        makeIncident({
          stackTrace: ["at Client.query (node_modules/pg/lib/client.js:510)"]
        })
      )
      expect(pgFeatures.hasDBDriverInStack).toBe(true)

      const redisFeatures = buildFeatures(
        makeIncident({
          stackTrace: ["at Commander.get (node_modules/redis/dist/commander.js:12)"]
        })
      )
      expect(redisFeatures.hasDBDriverInStack).toBe(true)
    })

    it("detects HTTP clients in stack", () => {
      const features = buildFeatures(
        makeIncident({
          stackTrace: ["at Axios.request (node_modules/axios/lib/core/Axios.js:45)"]
        })
      )
      expect(features.hasHTTPClientInStack).toBe(true)
    })

    it("detects framework libraries in stack", () => {
      const expressFeatures = buildFeatures(
        makeIncident({
          stackTrace: ["at Layer.handle (node_modules/express/lib/router/layer.js:95)"]
        })
      )
      expect(expressFeatures.hasFrameworkInStack).toBe(true)

      const fastifyFeatures = buildFeatures(
        makeIncident({
          stackTrace: ["at handleRequest (node_modules/fastify/lib/handleRequest.js:16)"]
        })
      )
      expect(fastifyFeatures.hasFrameworkInStack).toBe(true)
    })
  })

  describe("D. architectural patterns", () => {
    it("detects middleware pattern in stack", () => {
      const features = buildFeatures(
        makeIncident({
          stackTrace: [
            "at authMiddleware (src/middleware/auth.ts:15)",
            "at Layer.handle (node_modules/express/lib/router/layer.js:95)"
          ]
        })
      )
      expect(features.hasMiddlewarePattern).toBe(true)
    })

    it("detects controller pattern in stack", () => {
      const features = buildFeatures(
        makeIncident({
          stackTrace: [
            "at UsersController.getById (src/controllers/users.ts:30)",
            "at Layer.handle (node_modules/express/lib/router/layer.js:95)"
          ]
        })
      )
      expect(features.hasControllerPattern).toBe(true)
    })

    it("detects service pattern in stack", () => {
      const features = buildFeatures(
        makeIncident({
          stackTrace: [
            "at PaymentService.charge (src/services/payment.ts:55)",
            "at processOrder (src/orders.ts:12)"
          ]
        })
      )
      expect(features.hasServicePattern).toBe(true)
    })
  })

  describe("E. route / HTTP", () => {
    it("detects GET and POST methods", () => {
      const getFeatures = buildFeatures(
        makeIncident({ route: "GET /api/users" })
      )
      expect(getFeatures.isGET).toBe(true)
      expect(getFeatures.isPOST).toBe(false)

      const postFeatures = buildFeatures(
        makeIncident({ route: "POST /api/users" })
      )
      expect(postFeatures.isPOST).toBe(true)
      expect(postFeatures.isGET).toBe(false)
    })

    it("detects API routes", () => {
      const apiRoute = buildFeatures(
        makeIncident({ route: "GET /api/users" })
      )
      expect(apiRoute.isAPIRoute).toBe(true)

      const v1Route = buildFeatures(
        makeIncident({ route: "GET /v1/products" })
      )
      expect(v1Route.isAPIRoute).toBe(true)

      const graphqlRoute = buildFeatures(
        makeIncident({ route: "POST /graphql" })
      )
      expect(graphqlRoute.isAPIRoute).toBe(true)

      const nonApiRoute = buildFeatures(
        makeIncident({ route: "GET /about" })
      )
      expect(nonApiRoute.isAPIRoute).toBe(false)
    })

    it("counts route segments", () => {
      const features = buildFeatures(
        makeIncident({ route: "GET /api/users/123/orders" })
      )
      expect(features.routeSegmentCount).toBe(4)

      const empty = buildFeatures(makeIncident())
      expect(empty.routeSegmentCount).toBe(0)
    })
  })

  describe("F. breadcrumbs", () => {
    it("counts breadcrumbs", () => {
      const features = buildFeatures(
        makeIncident({
          breadcrumbs: [
            "HTTP GET /api/users",
            "SQL SELECT * FROM users",
            "HTTP POST /api/orders"
          ]
        })
      )
      expect(features.breadcrumbCount).toBe(3)
    })

    it("detects HTTP breadcrumbs", () => {
      const features = buildFeatures(
        makeIncident({
          breadcrumbs: ["fetch https://api.example.com/users [200]"]
        })
      )
      expect(features.hasHTTPBreadcrumbs).toBe(true)

      const noHttp = buildFeatures(
        makeIncident({ breadcrumbs: ["console.log: debug info"] })
      )
      expect(noHttp.hasHTTPBreadcrumbs).toBe(false)
    })

    it("detects last breadcrumb as 4xx", () => {
      const features = buildFeatures(
        makeIncident({
          breadcrumbs: [
            "fetch https://api.example.com/health [200]",
            "fetch https://api.example.com/missing [404]"
          ]
        })
      )
      expect(features.lastBreadcrumbIs4xx).toBe(true)
      expect(features.lastBreadcrumbIs5xx).toBe(false)
    })

    it("detects last breadcrumb as 5xx", () => {
      const features = buildFeatures(
        makeIncident({
          breadcrumbs: [
            "fetch https://api.example.com/health [200]",
            "fetch https://api.example.com/crash [500]"
          ]
        })
      )
      expect(features.lastBreadcrumbIs5xx).toBe(true)
      expect(features.lastBreadcrumbIs4xx).toBe(false)
    })
  })

  describe("G. context / infra", () => {
    it("detects staging environment", () => {
      const features = buildFeatures(
        makeIncident({ environment: "staging" })
      )
      expect(features.isStaging).toBe(true)
      expect(features.isProduction).toBe(false)
    })

    it("detects server OS", () => {
      const features = buildFeatures(
        makeIncident({ tags: { os: "Alpine Linux 3.18" } })
      )
      expect(features.isServerOS).toBe(true)
    })

    it("detects Lambda environment", () => {
      const features = buildFeatures(
        makeIncident({
          tags: { server_name: "my-api-lambda-handler" }
        })
      )
      expect(features.isLambda).toBe(true)
    })

    it("detects Docker from Alpine OS", () => {
      const features = buildFeatures(
        makeIncident({ tags: { os: "Alpine Linux 3.18" } })
      )
      expect(features.isDocker).toBe(true)
    })

    it("detects cloud provider from server name", () => {
      const features = buildFeatures(
        makeIncident({
          tags: { server_name: "ip-10-0-1-42.ec2.internal" }
        })
      )
      expect(features.hasCloudProvider).toBe(true)
    })
  })

  describe("H. text metrics", () => {
    it("counts title words", () => {
      const features = buildFeatures(
        makeIncident({ title: "TypeError: Cannot read property of undefined" })
      )
      expect(features.titleWordCount).toBe(6)
    })

    it("detects colon in title", () => {
      const withColon = buildFeatures(
        makeIncident({ title: "TypeError: something broke" })
      )
      expect(withColon.titleHasColon).toBe(true)

      const noColon = buildFeatures(
        makeIncident({ title: "Something broke" })
      )
      expect(noColon.titleHasColon).toBe(false)
    })

    it("detects presence of stack trace", () => {
      const withStack = buildFeatures(
        makeIncident({ stackTrace: ["at handler (src/api.ts:10)"] })
      )
      expect(withStack.hasStackTrace).toBe(true)

      const noStack = buildFeatures(makeIncident())
      expect(noStack.hasStackTrace).toBe(false)
    })

    it("normalizes error message length to [0, 1]", () => {
      const short = buildFeatures(
        makeIncident({ title: "Error" })
      )
      expect(short.errorMessageLength).toBeGreaterThan(0)
      expect(short.errorMessageLength).toBeLessThan(1)

      const long = buildFeatures(
        makeIncident({ title: "A".repeat(300) })
      )
      expect(long.errorMessageLength).toBe(1)

      const empty = buildFeatures(makeIncident())
      expect(empty.errorMessageLength).toBe(0)
    })
  })
})
