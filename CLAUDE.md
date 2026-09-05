# CLAUDE.md — AI Styling Asset Service

## Project Overview

Express.js + MongoDB (Mongoose) service for AI styling asset management. Handles CSV ingestion of SKU/product data, image/asset tracking, and thumbnail generation via AWS Lambda.

## Stack

- **Runtime**: Node.js (CommonJS — no ES modules)
- **Framework**: Express.js 4.x
- **Database**: MongoDB via Mongoose 8.x
- **Storage**: AWS S3 (pre-signed URLs for uploads, CloudFront for reads)
- **Dev server**: `npm start` (nodemon on port from `PORT` env var, default 7015)

## Project Structure

```
app.js                  — entry point
config.js               — env var exports
startup/
  router.js             — mounts routes, body parser, CORS, error handler
  db.js                 — Mongoose connection, addModel(), WrapInTransaction()
  eventEmitter.js       — global event emitter singleton
routes/
  index.js              — combines all route modules under /api/v1
  assetRoute.js         — /api/v1/asset/*
  skuRoute.js           — /api/v1/sku/*
  filterRoute.js        — /api/v1/filter/*
  healthRoute.js        — /api/v1/healthcheck
controllers/            — request/response handlers
services/               — business logic, DB queries, external calls
models/                 — Mongoose schemas and models
validations/            — celebrate/Joi request validation schemas
middlewares/            — Express middleware (errorHandler, etc.)
utils/                  — pure utilities (CloudFront, crypto, logger, pagination, etc.)
EventListeners/         — event-driven async handlers (filter sync, thumbnails)
test/                   — .http files for VS Code REST Client
```

## Mandates

### 1. Every API endpoint must have a `.http` entry

Every new route added **must** have **one** corresponding happy-path request entry in `test/<routeName>.http` using the VS Code REST Client format. Add additional entries (error cases, auth-negative, edge inputs) only when there is a concrete need — not by default. One entry per endpoint is the baseline.

Entries follow this format:
```
### Description
VERB http://localhost:7015/api/v1/path HTTP/1.1
Content-Type: application/json

{ "body": "if needed" }
```

### 2. Models use `addModel()` — never `mongoose.model()`

Always register models via `addModel(modelName, schema, collectionName)` from `startup/db.js`. The connection is a named Mongoose connection, not the default global one.

### 3. No hardcoded CSV column mappings

CSV data is stored raw in `csv.csvData: Object`. Do not map CSV headers to fixed schema fields. All columns go in as-is.

### 4. Pre-signed S3 upload pattern

File uploads use a two-step pre-signed URL flow — never multer or direct server-side multipart:
1. Client calls a `GET /<resource>/getCsvUploadUrl?fileName=x` to get `{ key, url }`
2. Client PUTs the file to S3 directly using the pre-signed URL
3. Client passes the `key` back to the import/processing endpoint

### 5. Path and Image schemas

Reuse `models/Path.schema.js` and `models/Image.schema.js` for any asset/image fields. These handle CloudFront URL generation and thumbnail job emission automatically.

### 6. Request validation uses celebrate/Joi

All route validation is done via celebrate middleware in `validations/`. Celebrate's error handler is mounted in `startup/router.js` after the router. Do not duplicate validation logic in controllers — let Joi handle it.

### 7. Error handling

- Validation failures → handled by celebrate middleware (400 with Joi details)
- Business logic errors → `Api400Error` via `next(err)`
- Unexpected errors → `next(err)` → caught by `errorHandler` middleware → 500

### 8. Filter model for UI field discovery

The `Filter` model pre-aggregates distinct `patternDict` key-value pairs per `clientName`. Updated via `filter-update` event emitted during SKU creation in `findOrCreateSku`/`resolveSkus`. The `filtersSynced` flag on SKU tracks whether filters have been synced.

### 9. Bulk asset creation

`POST /api/v1/asset/create` accepts `{ clientName, createWithoutCSVData, files[] }` where each file has `barcode` + `images[]`. SKUs are resolved in batch (`resolveSkus`), assets are created in batches of 50 to bound concurrency.

### 10. Auth-by-default for new APIs

Every new route must be auth-protected unless it is explicitly a public endpoint (e.g. `/healthcheck`, browser-facing FE list/get views currently served unauthenticated). Default mechanism today is `apiKeyAuth` from `middlewares/apiKeyAuth.js` (validates `x-api-key` against `PARTNER_API_KEYS`); when a richer auth layer (JWT/session) lands, swap to that. Pattern:

```js
const { apiKeyAuth } = require('../middlewares/apiKeyAuth');
router.post('/something', apiKeyAuth, validation.something, controller.something);
```

If a new endpoint is intentionally public, call that out in the route file with a one-line comment so it isn't missed in review. The matching `.http` entry must include the `x-api-key: {{PARTNER_API_KEY}}` header for protected routes (no separate 401 negative-case entry by default — only add if there's a reason).

### 11. Reference repos for patterns

Before implementing new patterns, check sibling repos:
- **pegasus** — `csvData`, `OrderCsvData`, CSV ingestion patterns
- **phoenix** — `Path.schema`, `Image.schema`, pre-signed URL flows, thumbnail generation

## Key Utilities

| Utility | Path | Purpose |
|---|---|---|
| `addModel` | `startup/db.js` | Register Mongoose models |
| `WrapInTransaction` | `startup/db.js` | MongoDB session transactions |
| `getS3PreSignedpath` | `services/amazonS3Service.js` | Pre-signed PUT URL |
| `getS3CsvPreSignedUrl` | `services/amazonS3Service.js` | Pre-signed PUT URL for CSVs |
| `getS3Object` | `services/amazonS3Service.js` | Fetch file Buffer from S3 |
| `getUrlFromKey` | `utils/CloudFront.s3.js` | CloudFront read URL from S3 key |
| `GetMD5Hash` | `utils/crypto.js` | MD5 hash for thumbnail key gen |
| `ColorLogger` | `utils/ColorLogger.js` | Colored console output |
| `getSkipAndLimitForPagination` | `utils/pagination.js` | pageNum/pageSize → skip/limit |

## Environment Variables

```
PORT
DB_CONNECTION_STRING
DB_USER
DB_PASSWORD
s3Bucket
s3Region
s3AccessKey
s3SecretKey
slackBotToken
```
