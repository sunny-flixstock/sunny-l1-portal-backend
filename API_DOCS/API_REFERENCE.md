# AI Styling Asset Service — API Reference

Express.js + MongoDB service for AI styling asset management. Covers CSV ingestion of SKU/product data, asset/image lifecycle, semantic search (pgvector), AI framework construction, and angle/spec management for output generation.

Behaviors below are derived from the actual handler + service code, not just route signatures. Where behavior is non-obvious or has side effects (events, transactions, fire-and-forget jobs, vector store writes, S3/LLM calls), it is called out explicitly.

## Base URL

```
/api/v1
```

## Global conventions

### Body / CORS

- JSON body parser, **50 MB** limit.
- CORS: open (`*`) for `GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD`; exposes `Content-Disposition`.

### Validation

- All request validation is celebrate/Joi. Schemas live in `validations/*.validation.js`.
- Validation failures → **400** with Joi details (via `celebrate.errors()`).

### Errors

| Status | Source |
|--------|--------|
| `400`  | celebrate/Joi validation, or `Api400Error` thrown in service layer |
| `401`  | Invalid/missing `x-api-key` on partner endpoints |
| `404`  | Doc-not-found cases that explicitly return 404 (rare; most "not found" is 400) |
| `500`  | Global `errorHandler` middleware |
| `501`  | `GET /api/v1/asset` (split into semantic + mongo variants) |

### Authentication

Partner-facing endpoints require `x-api-key` (validated against `PARTNER_API_KEYS`):

- `GET /api/v1/sku/semanticSearchPartner`
- `GET /api/v1/asset/semanticSearchPartner`
- `GET /api/v1/partner/angle-preset`
- `GET /api/v1/partner/framework`

**401 response**: `{ "message": "Invalid or missing API key" }`

### Pre-signed S3 upload pattern

Asset/image uploads use a two-step pre-signed PUT flow (per repo mandate). The CSV ingest endpoint (`POST /api/v1/sku/importCsv`) is the **only** exception — it accepts a multipart upload via `multer` (in-memory, 10 MB max, CSV mime types only).

### Pagination

Standard envelope (varies slightly per endpoint):

```json
{ "data": [...], "pagination": { "total": 0, "pageNum": 1, "pageSize": 20, "totalPages": 0 } }
```

Defaults: `pageNum=1`, `pageSize=20` (max 100; the value list on `/filter/searchValues` allows up to 200).

### IDs

All MongoDB `_id` params are 24-character hex strings.

### Background jobs / events

Several endpoints emit events or schedule deferred work:

- **`filter-update`** — emitted during SKU create/update; the `Filter` collection re-aggregates distinct `patternDict` keys per client.
- **`embedding-sync`** — emitted when a SKU is flagged `readyForEmbedding=true`; consumed by the embedding worker.
- **`bumpIngestionSchedule`** — a 5-minute debounce: schedules SKU embedding only when the SKU still has ≤2 assets, so newly-ingested SKUs settle before being embedded.

---

## Endpoint index

| Group | Base path |
|-------|-----------|
| [Healthcheck](#healthcheck) | `/healthcheck` |
| [SKU](#sku) | `/sku` |
| [Asset](#asset) | `/asset` |
| [Filter](#filter) | `/filter` |
| [Client](#client) | `/client` |
| [Framework Group](#framework-group) | `/framework-group` |
| [Framework Version](#framework-version) | `/framework-version` |
| [Rule](#rule) | `/rule` |
| [Example Image](#example-image) | `/example-image` |
| [Input Set](#input-set) | `/input-set` |
| [System Instruction](#system-instruction) | `/system-instruction` |
| [Model Catalog](#model-catalog) | `/model-catalog` |
| [Framework Vocab](#framework-vocab) | `/framework-vocab` |
| [Category Registry](#category-registry) | `/category-registry` |
| [Base Angle](#base-angle) | `/base-angle` |
| [Client Angle](#client-angle) | `/client-angle` |
| [Angle Technical Specification](#angle-technical-specification) | `/angle-technical-specification` |
| [Angle Preset](#angle-preset) | `/angle-preset` |
| [Partner Angle Preset](#partner-angle-preset) | `/partner/angle-preset` |
| [Partner Framework](#partner-framework) | `/partner/framework` |
| [Utility](#utility) | `/util` |
| [API Docs](#api-docs) | `/api-docs` |

---

<a id="healthcheck"></a>

## Healthcheck

### `GET /api/v1/healthcheck`

Liveness probe.

**Response — 200**
```json
{ "uptime": 1234.56, "message": "OK", "timestamp": 1700000000000, "packageJsonVersion": "x.y.z" }
```
Returns `503` on internal error.

---

<a id="sku"></a>

## SKU

A SKU represents one product (barcode + clientName). It stores the raw CSV row (`csvData`), the derived `patternDict` (used by filters and semantic search), the `shouldNotProduce` flag, async description / embedding state, and a denormalized `enableFXGTOM` (inherited from the parent `Client` at create time; the `ingestionSweep` cron skips SKUs where this is explicitly `false`).

### `GET /api/v1/sku`

Search SKUs by `patternDict` dot-notation filters and other fields.

**Query**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `clientName` | string | yes | |
| `barcode` | string | no | case-insensitive substring match |
| `isActive` | `'true'` \| `'false'` | no | defaults to active |
| `createdWithoutCSVDataPreCheck` | `'true'` \| `'false'` | no | |
| `embeddingDone` | `'true'` \| `'false'` | no | omit for all |
| `createdAfter` | ISO date / `YYYY-MM-DD` | no | start of day (inclusive) |
| `createdBefore` | ISO date / `YYYY-MM-DD` | no | end of day (inclusive) |
| `pageNum` / `pageSize` | integer | no | std pagination |
| `filter` | object | no | `{ "<patternDict.key>": "value" | ["v1","v2"] }` |

**Response — 200**: each SKU includes `assets` (all active assets) and `displayAsset` (first asset, backward compat).
```json
{ "data": [ { "...sku": "...", "assets": [{ "_id": "...", "barcode": "...", "image": {...}, "createdAt": "..." }], "displayAsset": { "_id": "...", "barcode": "...", "image": {...} } } ], "pagination": {...} }
```

### `GET /api/v1/sku/statsByClient`

Active client SKU and internal SKU counts per client (aggregation). Includes all registered clients; clients with no data return `0` counts.

Internal SKUs are active SKUs under the internal client (`FLIXSTOCK`) with `associatedTo` set to the client code.

**Response — 200**
```json
{ "data": [ { "clientName": "BZT", "skuCount": 42, "internalSkuCount": 15 } ], "total": 3 }
```

### `GET /api/v1/sku/:id`

Fetch a single SKU with all active assets.

**Params**: `id` — 24-char hex ObjectId.

**Response — 200**
```json
{ "data": { "...sku": "...", "assets": [ { "_id": "...", "barcode": "...", "image": {...}, "createdAt": "...", "usageCounter": 0 } ] } }
```

**400** — invalid id or SKU not found.

### `GET /api/v1/sku/semanticSearchPartner` *(requires `x-api-key`)*

Fuzzy semantic search backed by the **partner** embedding column in the vector store. Generates an embedding for the query, finds matching SKU IDs by cosine similarity, then enriches each with its assets.

**Query**: same as `GET /sku`, plus the implicit `fuzzy_text` handling in the service.

**Response — 200**
```json
{
  "data": [
    { "...sku": "...", "similarity": 0.83, "assets": [ { "_id": "...", "image": {...}, "usageCounter": 0, "createdAt": "..." } ] }
  ],
  "pagination": { "unit": "sku", "total": 0, "pageNum": 1, "pageSize": 20, "totalPages": 0 }
}
```

### `POST /api/v1/sku/importCsv`

Multipart CSV ingest. Auto-detects tab vs comma delimiter. Validates each row against the client's `csvConfig` (required columns, allowed values, source-alias normalization, intra-CSV duplicate-barcode detection). Upserts both `SkuCsv` (dot-notation merged `csvData`) and `Sku` via `mergeAndPropagatePatternDict` (which also propagates `patternDict` to existing Assets and clears `embeddingDone`). Records the run in `CsvIngestion`. Emits `filter-update` per touched SKU.

**Query**: `clientName` (required).
**Body**: `multipart/form-data` field `file` (CSV, ≤ 10 MB; mime types `text/csv`, `text/plain`, `application/vnd.ms-excel`, `application/octet-stream`).

**Response — 200**
```json
{
  "message": "CSV imported successfully",
  "ingestionId": "<24-hex>",
  "stats": { "skusTotal": 0, "skusIdentified": 0, "skusNew": 0 }
}
```

**400** — no file, parse error, or validation failures (response includes per-row error list).

### `POST /api/v1/sku/doNotProduce`

Toggle `shouldNotProduce`. Always upserts `SkuCsv` so the flag survives even before a CSV row exists. If the `Sku` already exists, the flag also cascades to all related `Asset` rows **and** to the vector store metadata (so search excludes them when desired).

**Body**

| Field | Type | Required |
|-------|------|----------|
| `barcode` | string | yes |
| `clientName` | string | yes |
| `shouldNotProduce` | boolean | yes |

**Response — 200**
```json
{
  "shouldNotProduce": true,
  "skuExisted": true,
  "skuCsvUpserted": true,
  "assetsUpdated": 4,
  "vectorRowsUpdated": 1
}
```

### `POST /api/v1/sku/saveCsvData`

Merge additional CSV-style metadata into a single SKU. Validates the row against `csvConfig`, then runs the same upsert path used by `importCsv` (dot-notation merge into `SkuCsv`, `mergeAndPropagatePatternDict` into `Sku` + `Asset`).

**Body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `barcode` | string | yes | |
| `clientName` | string | yes | |
| `csvData` | object | yes | ≥ 1 property; keys may not start with `$` |

**Response — 200**: `{ "result": { "barcode": "...", "created": false, "modified": true } }`

---

<a id="asset"></a>

## Asset

An Asset is one image (or set of images) bound to a SKU. Stored via `Path` / `Image` schemas, which auto-generate CloudFront read URLs and emit thumbnail-generation jobs.

### `GET /api/v1/asset/getUploadUrl`

Single pre-signed S3 PUT URL.

**Query**: `fileName`, `clientName` (both required).

**Response — 200**: `{ "key": "...", "url": "https://s3...", "host": "<s3Bucket>", "contentType": "image/jpeg" }`

### `POST /api/v1/asset/internalAssetUploadUrls`

Batch pre-signed URLs for *internal* assets, allocating an `assetSeq` block per barcode (via `nextAssetSeqBlock`). If `barcode` is omitted, a new SKU is created on the fly.

**Body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `clientName` | string | yes | |
| `associatedTo` | string | no | required for internal assets |
| `barcode` | string | no | if omitted, a new SKU is created |
| `files[]` | array | yes | 1+ items |
| `files[].ext` | string | yes | `^\.?[a-z0-9]{1,8}$` |
| `files[].mimeType` | string | no | |

**Response — 200**
```json
{
  "barcode": "...",
  "skuId": "...",
  "skuCreated": false,
  "files": [
    { "assetSeq": 17, "fileName": "...", "key": "...", "host": "...", "url": "https://s3...", "contentType": "image/jpeg" }
  ]
}
```

### `POST /api/v1/asset/create`

Bulk-create assets keyed by barcode. If `clientName` doesn't yet exist as a `Client`, it is auto-upserted with `enableFXGTOM:false` (opt-in by default) — Flixstudio must explicitly `PATCH /client/:code/enableFXGTOM` to enable description generation. Existing clients are not modified. SKUs are resolved in batch (`resolveSkus`); assets are written in batches of 10. Deduplicates on `(skuId, image.imagePath.host, image.imagePath.key)`. For newly-created SKUs with ≤ 2 assets, calls `bumpIngestionSchedule` (5-min debounce → embedding). New SKUs inherit the client's current `enableFXGTOM` value.

**Body**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `clientName` | string | yes | |
| `createWithoutCSVData` | boolean | no | `false` |
| `files[]` | array | yes | |
| `files[].barcode` | string | yes | |
| `files[].images[]` | array | yes | min 1 |
| `files[].images[].name` | string | no | |
| `files[].images[].imagePath.key` | string | yes | |
| `files[].images[].imagePath.host` | string | yes | |
| `files[].images[].characteristics` | object | no | |

**Response — 200** (per-file success/failure)
```json
{
  "data": [
    {
      "barcode": "...",
      "success": true,
      "assets": [ { "_id": "...", "patternDict": {...}, "existed": false } ]
    }
  ]
}
```
Per-file errors come back as `{ "barcode": "...", "success": false, "error": "..." }`.

### `POST /api/v1/asset/createWithProperties`

Same as `/create`, but each `files[]` item may carry a `skuProperties` object that is merged onto the resolved SKU's `patternDict` via `mergeAndPropagatePatternDict` (which also clears `embeddingDone` and propagates to existing Assets).

### `GET /api/v1/asset`

**501 Not Implemented.** Endpoint is being split into the two semantic variants below.

### `GET /api/v1/asset/semanticSearch`

Vector-store search. If `fuzzy_text` is omitted, falls back to plain Mongo filter search (`searchAssets`). Otherwise embeds the query, runs cosine similarity against the SKU vector index with JSONB filter pushdowns, then fetches assets ordered by SKU rank + `createdAt`.

**Query**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `clientName` | string | yes | |
| `barcode` | string | no | |
| `skuId` | string | no | 24-hex |
| `isActive` | `'true'` \| `'false'` | no | |
| `fuzzy_text` | string | no | 1–500 chars |
| `includeInternal` | boolean | no | |
| `pageNum` / `pageSize` | integer | no | std |
| `filter` | object | no | `patternDict` dot-notation |

**Response — 200**
```json
{
  "data": [ { "...asset": "...", "similarity": 0.81 } ],
  "pagination": { "unit": "sku", "total": 0, "pageNum": 1, "pageSize": 20, "totalPages": 0 }
}
```

### `GET /api/v1/asset/semanticSearchPartner` *(requires `x-api-key`)*

Same shape; queries the **partner** embedding column.

### `PATCH /api/v1/asset/updateAssetUsageCounter`

Bulk-increment `usageCounter` on assets.

**Body**: `{ "assetIds": ["<24-hex>", ...] }` (min 1).

**Response — 200**: `{ "modifiedCount": 0 }`

---

<a id="filter"></a>

## Filter

The `Filter` collection caches distinct `patternDict` keys/values per client (refreshed via the `filter-update` event during SKU writes).

### `GET /api/v1/filter`

**Query**: `clientName` (required).

**Response — 200**: `{ "data": [ { "key": "...", "values": ["...", "..."] } ] }`

### `GET /api/v1/filter/searchValues`

Live search across values of one filter key. Scans up to **2000** SKU docs, dedupes, sorts, then paginates — sets `scanCapped: true` if the 2000-doc ceiling was hit.

**Query**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `clientName` | string | yes | |
| `key` | string | yes | filter key |
| `q` | string | yes | min 1 |
| `pageNum` | integer | no | 1 |
| `pageSize` | integer | no | 20 (max 200) |

**Response — 200**: `{ "data": { "values": [...], "total": 0, "scanCapped": false } }`

---

<a id="client"></a>

## Client

A `Client` carries the per-tenant config:

| Field | Type | Notes |
|---|---|---|
| `code` | string | unique, immutable identifier |
| `displayName` | string | optional human label |
| `enableFXGTOM` | boolean | gates the description-generation pipeline for SKUs of this client. Default **`false`** on new clients — must be explicitly set to `true` for Flixstudio GTOM to process them. Existing clients with this field absent are treated as enabled (legacy compatibility). |
| `csvConfig` | object | CSV column rules used by ingest |
| `skuSeq` | number | internal SKU sequence counter |

### `GET /api/v1/client`

**Query**: `q` (search), `pageNum`, `pageSize`.
**Response — 200**: `{ "data": [...], "pagination": {...} }`

### `GET /api/v1/client/all`

Unpaginated client list for dropdowns.

**Query**: `q` (optional search on `code`).
**Response — 200**: `{ "data": [{ "code", "displayName", "enableFXGTOM" }], "total": N }`

### `GET /api/v1/client/:code`

**Response — 200**: `{ "data": <Client> }`

### `POST /api/v1/client`

**Body**: `code` (1–64), `displayName?` (≤ 256), `enableFXGTOM?` (boolean — defaults to `false` if omitted).
**Response — 201**: `{ "data": <Client> }`
Returns `400` if `code` already exists.

### `POST /api/v1/client/bulk`  *(apiKeyAuth)*

Idempotent per-row upsert of clients. Safe to re-send the same payload — existing clients are not modified.

**Headers**: `x-api-key`.
**Body**
```json
{
  "clients": [
    { "code": "...", "displayName": "...", "enableFXGTOM": true },
    { "code": "...", "displayName": "...", "enableFXGTOM": false }
  ]
}
```
Each item requires all three fields. Array length 1–500.

**Response — 200**
```json
{
  "data": [
    { "code": "...", "status": "created" },
    { "code": "...", "status": "existed" }
  ]
}
```
Per-row failures surface as `{ "code": "...", "status": "error", "error": "..." }`.

### `PATCH /api/v1/client/:code/enableFXGTOM`  *(apiKeyAuth)*

Flips the description-generation kill switch for one client and fan-outs the value to every SKU of that client in one update.

- `true → false`: SKUs get `enableFXGTOM:false` and their pending `ingestionScheduledAt` is cleared. The `ingestionSweep` cron will no longer pick those SKUs, so no new LLM description calls fire. SKUs already mid-LLM-call finish; embedding follow-on is **not** gated and runs if it would have.
- `false → true`: SKUs get `enableFXGTOM:true`. Anything with a stale `ingestionScheduledAt` is picked on the next sweep tick (≤ 1 min). Auto-regen for never-scheduled SKUs is a planned future feature.

**Headers**: `x-api-key`.
**Body**: `{ "enableFXGTOM": true | false }`
**Response — 200**: `{ "data": <Client> & { skusUpdated: <number> } }`
Returns `400` if the client does not exist.

### `PATCH /api/v1/client/:code/csvConfig`

Set the column schema used to validate this client's CSV ingests.

**Body**
```json
{
  "csvConfig": {
    "columns": {
      "<columnName>": {
        "required": true,
        "allowedValues": ["..."],
        "sources": ["alias1", "alias2"]
      }
    }
  }
}
```
**Response — 200**: `{ "data": <Client> }`

---

<a id="framework-group"></a>

## Framework Group

Buckets `FrameworkVersion`s by `client / gender / season / category`. Holds `activeProductionFrameworkVersionId` (set by `make-live`) and a version sequence counter (incremented when a new version is created).

### `GET /api/v1/framework-group`

**Query**: `client`, `gender`, `season`, `category`, `q`, pagination.

### `GET /api/v1/framework-group/:id`

### `POST /api/v1/framework-group` — **201**

**Body**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `client` | string | yes | |
| `gender` / `season` / `category` | string | no | `null` |
| `priority` | integer | no | `0` |
| `name` | string | no | `null` |

### `PUT /api/v1/framework-group/:id`

Same body shape.

### `DELETE /api/v1/framework-group/:id`

---

<a id="framework-version"></a>

## Framework Version

A versioned framework spec tied to a group. Combines an input set, vocabulary, category registry, domains, and per-domain LLM instructions.

### `GET /api/v1/framework-version`

**Query**: `client`, `frameworkGroupId` (24-hex), `status`, `q`, pagination.

**Response — 200** (each item is **enriched** with referenced docs):
```json
{
  "data": [
    {
      "...version": "...",
      "frameworkGroup": {...},
      "inputSetSummary": {...},
      "frameworkVocabSummary": {...},
      "categoryRegistrySummary": {...},
      "descriptionGenerationInstructions": [ { "domain": "...", "instructionId": "...", "instruction": {...} } ],
      "frameworkCreationInstructions": [ {...} ]
    }
  ],
  "pagination": {...}
}
```

### `GET /api/v1/framework-version/:id`

Same enrichment.

### `POST /api/v1/framework-version` — **201**

Validates: ≥1 unique non-empty `domains`; one description+framework instruction per domain; `inputSet`, `frameworkVocabId`, `categoryRegistryId` exist. Increments the group's version sequence. Also calls `markInputSetActiveIfDraft` (auto-activates a draft input set).

**Body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `frameworkGroupId` | string | yes | 24-hex |
| `client` | string | yes | |
| `name` | string | yes | min 1 |
| `domains[]` | string[] | yes | non-empty, unique |
| `descriptionGenerationInstructions[]` | array | yes | one per domain |
| `frameworkCreationInstructions[]` | array | yes | one per domain |
| `inputSet` | string (24-hex) | yes | |
| `frameworkVocabId` | string (24-hex) | yes | |
| `categoryRegistryId` | string (24-hex) | yes | |

Each instruction: `{ domain, instructionId, provider, model }`.

### `POST /api/v1/framework-version/:id/start-creation`

Validates preconditions (draft status, has input set + instructions, referenced vocab/registry exist), then triggers the **async** description-generation + framework-build pipeline.

**Response — 200**: handler returns the job submission result (e.g. `{ submitted: true, ... }`).
**400** — not in draft or preconditions missing.

### `GET /api/v1/framework-version/:id/domain-descriptions`

**Response — 200**: `{ "data": { "<domain>": "markdown...", ... } }`

### `PATCH /api/v1/framework-version/:id/domain-descriptions/:domain`

**Path**: `id` (24-hex), `domain` (must be in `DOMAINS` enum).
**Body**: `{ "contentMarkdown": "..." }` (min 1).
**Response — 200**: `{ "data": <FrameworkVersion> }`

### `POST /api/v1/framework-version/:id/archive`

### `POST /api/v1/framework-version/:id/make-live`

Marks this version live and updates the parent `FrameworkGroup.activeProductionFrameworkVersionId`.

**Response — 200**: `{ "success": true, "frameworkVersionId": "...", "frameworkGroupId": "..." }`
**400** — version not in `ready` or `active` status.

### `POST /api/v1/framework-version/:id/demote-to-in-review`

Demotes this version (`promoted` → `in_review`) and clears `FrameworkGroup.activeProductionFrameworkVersionId`.

---

<a id="rule"></a>

## Rule

### `GET /api/v1/rule/meta`

Enum metadata (types, polarities, priorities, sources).

### `GET /api/v1/rule`

**Query**

| Field | Type | Notes |
|-------|------|-------|
| `client` | string | |
| `ruleType` | string | comma-separated, values from `RULE_TYPES` |
| `polarity` | string | comma-separated, from `RULE_POLARITIES` |
| `priority` | string | comma-separated, from `RULE_PRIORITIES` |
| `source` | string | comma-separated, from `RULE_SOURCES` |
| `q`, `pageNum`, `pageSize` | — | std |

### `GET /api/v1/rule/:id`

### `POST /api/v1/rule` — **201**

**Body**

| Field | Type | Notes |
|-------|------|-------|
| `client` | string | required |
| `ruleType` | string | `RULE_TYPES` |
| `polarity` | string | `RULE_POLARITIES` |
| `ruleText` | string | min 1 |
| `priority` | string | `RULE_PRIORITIES` |
| `source` | string | `RULE_SOURCES` |
| `createdBy` | string | optional |

### `POST /api/v1/rule/bulk` — **201**

**Body**: `{ "rules": [<ruleSchema>, ...] }` — 1–500 items.
**Response**: `{ "data": [<Rule>, ...], "count": N }`.

### `PUT /api/v1/rule/:id`

### `DELETE /api/v1/rule/:id`

---

<a id="example-image"></a>

## Example Image

Reference images used as input to framework builders / image-description training.

### `GET /api/v1/example-image/meta`

### `GET /api/v1/example-image/tags`

**Query**: `client` (optional).
**Response — 200**: `{ "data": ["tag1", "tag2", ...] }`

### `GET /api/v1/example-image`

**Query**: `client`, `type` (CSV of `EXAMPLE_IMAGE_TYPES`), `tags`, pagination.

### `GET /api/v1/example-image/:id`

### `POST /api/v1/example-image/presign`

Pre-signed PUTs (and bucket name) for direct S3 upload.

**Body**: `{ client, files: [ { fileName, contentType }, ... ] }` (1–50 files).
**Response — 200**:
```json
{ "data": [ { "fileName": "...", "contentType": "...", "key": "...", "url": "https://s3...", "bucket": "..." } ] }
```

### `POST /api/v1/example-image/thumbnail-status`

**Body**: `{ "ids": ["<24-hex>", ...] }` (1–50).
**Response — 200**: `{ "data": [ { "id": "...", "thumbnailStatus": "...", "...": "..." } ] }`

### `POST /api/v1/example-image/batch-update`

**Body**: `{ "updates": [ { "id": "<24-hex>", "type"?: "...", "tags"?: [...] }, ... ] }` (1–50).

### `POST /api/v1/example-image` — **201**

Creates the metadata record for an uploaded image.

**Body**: `client`, `type` (`EXAMPLE_IMAGE_TYPES`), `tags?`, `imageKey` (S3 key from presign), plus `originalFileName?`, `storageFileName?`, `etag?`, `uploadedBy?`.

### `PUT /api/v1/example-image/:id`

**Body**: any of `type`, `tags`, `uploadedBy` (≥ 1 required).

### `DELETE /api/v1/example-image/:id`

---

<a id="input-set"></a>

## Input Set

Bundle of rules + example images that a framework version draws from.

### `GET /api/v1/input-set`

**Query**: `client`, `status` (`INPUT_SET_STATUSES`), `q`, pagination.

### `GET /api/v1/input-set/:id`

### `POST /api/v1/input-set` — **201**

**Body**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `name` | string | yes | |
| `client` | string | yes | |
| `createdBy` | string | no | `null` |
| `clientRulesIds[]` | string (24-hex) | no | `[]` |
| `exampleImageIds[]` | string (24-hex) | no | `[]` |
| `notes` | string | no | `null` |

### `PUT /api/v1/input-set/:id`

### `DELETE /api/v1/input-set/:id`

Archive (soft delete) by ID.

---

<a id="system-instruction"></a>

## System Instruction

LLM system prompts (versioned). The prompt body is stored in the prompt registry; the DB record carries the metadata. `includeContent=true` hydrates the body on read.

### `GET /api/v1/system-instruction/types`

`{ "data": ["image_description", "framework_builder", "client_angle_definition", ...] }`

### `GET /api/v1/system-instruction/meta`

### `GET /api/v1/system-instruction`

**Query**: `instructionType`, `status`, `seriesKey`, `q`, pagination.

### `GET /api/v1/system-instruction/:id`

**Query**: `includeContent` (`'true'` | `'false'`, default `'false'`).

### `POST /api/v1/system-instruction` — **201**

Uploads `systemPrompt` to the prompt registry and stores metadata.

**Body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | min 1 |
| `instructionType` | string | yes | `INSTRUCTION_TYPES` |
| `purpose` | string | yes | min 1 |
| `systemPrompt` | string | yes | min 1 |
| `outputSchema` | object \| string | no | default `{}` |
| `seriesKey` | string | no | |

Response does **not** echo the prompt body.

### `PATCH /api/v1/system-instruction/:id/name`

### `DELETE /api/v1/system-instruction/:id`

Archive (soft delete).

---

<a id="model-catalog"></a>

## Model Catalog

### `GET /api/v1/model-catalog/description`

Static in-memory catalog of allowed `(provider, model)` pairs for description generation.

**Response — 200**: `{ "data": [ { "provider": "...", "model": "...", "name": "..." } ] }`

---

<a id="framework-vocab"></a>

## Framework Vocab

Controlled vocabulary referenced by a framework version.

### `GET /api/v1/framework-vocab`

**Query**: `q`, pagination.

### `GET /api/v1/framework-vocab/:id`

### `POST /api/v1/framework-vocab` — **201**

**Body**: `{ name, vocab: <object|array> }`.

### `DELETE /api/v1/framework-vocab/:id`

---

<a id="category-registry"></a>

## Category Registry

Hierarchical category tree referenced by a framework version.

### `GET /api/v1/category-registry`

**Query**: `q`, pagination.

### `GET /api/v1/category-registry/:id`

### `POST /api/v1/category-registry` — **201**

**Body**: `{ name, registry: <object|array> }`.

### `DELETE /api/v1/category-registry/:id`

---

<a id="base-angle"></a>

## Base Angle

A canonical photographic angle (e.g. "Front", "Back"), client-agnostic. Series-versioned: each `seriesKey` may have multiple versions, only one `active` at a time.

### `GET /api/v1/base-angle/meta`

### `GET /api/v1/base-angle`

**Query**: `q`, `status` (`ANGLE_STATUSES` or `'all'`, default `'active'`), pagination.

### `POST /api/v1/base-angle/presign`

**Body**: `{ files: [ { fileName, contentType } ] }` (1–50).
**Response — 200**: `{ "data": [ { fileName, contentType, key, url, storageFileName, originalFileName, bucket } ] }`

### `GET /api/v1/base-angle/series/:seriesKey/versions`

All versions of a series, sorted `version` descending.

### `GET /api/v1/base-angle/:id`

**Query**: `includeContent` (`'true'` | `'false'`) — when true, response includes `definitionMarkdown` fetched from storage.

### `POST /api/v1/base-angle` — **201**

**Body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | no\* | |
| `seriesKey` | string | no\* | one of `name` or `seriesKey` required |
| `definitionMarkdown` | string | yes | min 1 |
| `sampleImages[]` | array | no | image-path objects |

Each `sampleImages[]` item: `{ imagePath: { key, host?, channel? }, name?, description? }`.

### `POST /api/v1/base-angle/:id/archive`

### `PATCH /api/v1/base-angle/:id/name`

---

<a id="client-angle"></a>

## Client Angle

Per-client variant of a base angle (e.g. CLIENT_A's "Front view"). Series-versioned. Holds reference images and a definition markdown.

### `GET /api/v1/client-angle/meta`

`{ "data": { "statuses": [...], "instructionType": "...", "instructionTypes": [...] } }`

### `GET /api/v1/client-angle`

**Query**: `client`, `baseAngleSeriesKey`, `q`, `status` (default `'active'`), pagination.

### `GET /api/v1/client-angle/all`  *(apiKeyAuth)*

Unpaginated list of all client angles for one client. Intended for service-to-service sync.

**Headers**: `x-api-key`.
**Query**: `client` (required), `baseAngleSeriesKey?`, `q?`, `status?` (default `'active'`).
**Response — 200**: `{ "data": [...enriched client angles...], "total": <number> }`.

### `POST /api/v1/client-angle/presign`

**Body**: `{ client, files: [ { fileName, contentType } ] }` (1–50).

### `POST /api/v1/client-angle/generate` — **201**

**Synchronous LLM call inside the request.** Fetches up to N reference images from S3 (20 s timeout per image), calls Claude with vision + the configured system prompt (`temperature=0.3`, `responseFormat='text'`), uploads the resulting markdown to S3, creates a new `ClientAngle`, and archives the prior active version in a transaction.

**Body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `client` | string | yes | |
| `baseAngleId` | string | yes | 24-hex; must be `active` |
| `systemInstructionId` | string | yes | 24-hex; must be `active` + correct type |
| `referenceImages[]` | array | yes | min 1 image-path objects |
| `provider` | string | yes | `ALLOWED_PROVIDERS` |
| `model` | string | yes | min 1 |
| `name` | string | no | |
| `seriesKey` | string | no | |

**Response — 201**: `{ "data": { "...clientAngle": "...", "definitionMarkdown": "..." } }`

**400** — base angle not active, instruction not active/correct type, no reference images, empty LLM response, `seriesKey` conflicts with existing series.

### `POST /api/v1/client-angle` — **201**

Manual revision: upload a new markdown definition for an existing series. Creates a new version and archives the prior active one in a transaction.

**Body**: `{ seriesKey (required), definitionMarkdown (required, min 1), name? }`.

### `GET /api/v1/client-angle/series/:seriesKey/versions`

All versions of a series, sorted `version` descending.

### `GET /api/v1/client-angle/:id`

**Query**: `includeContent` (`'true'` | `'false'`).

### `POST /api/v1/client-angle/:id/archive`

**400** if already archived.

### `PATCH /api/v1/client-angle/:id/name`

**400** if not active.

---

<a id="angle-technical-specification"></a>

## Angle Technical Specification

Output-image technical specs (dimensions, background, color mode, file format). Deduplicated on `specHash` — re-creating an identical spec returns the existing doc.

### `GET /api/v1/angle-technical-specification/meta`

### `GET /api/v1/angle-technical-specification`

**Query**: `client`, `q`, pagination.

### `GET /api/v1/angle-technical-specification/:id`

### `POST /api/v1/angle-technical-specification`

**Status code**: `201` on create, `200` when an existing spec is returned (dedup); the response data carries a `deduplicated: boolean` flag.

**Body**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `name` | string | yes | |
| `client` | string | yes | |
| `dimensions.width` | integer | yes | min 1 |
| `dimensions.height` | integer | yes | min 1 |
| `dimensions.dpi` | integer | yes | min 1 |
| `background.color` | string | no | `'#FFFFFF'` |
| `fileSpecifications.colorMode` | string | yes | `COLOR_MODES` |
| `fileSpecifications.fileFormat` | string | yes | `FILE_FORMATS` |

### `DELETE /api/v1/angle-technical-specification/:id`

---

<a id="angle-preset"></a>

## Angle Preset

A bundle of `(clientAngle, [ (angleTechnicalSpec, namingPattern), ... ])` entries that drives output generation. POST validates that every referenced client angle is `active`, belongs to the client, and appears at most once. Responses enrich each entry with the full `clientAngle` and `angleTechnicalSpecification` docs.

### `GET /api/v1/angle-preset`

**Query**: `client`, `q`, pagination.
**Response — 200**: `{ data: [ <enriched preset> ], pagination: {...} }`

### `GET /api/v1/angle-preset/:id`

### `POST /api/v1/angle-preset` — **201**

**Body**

| Field | Type | Required |
|-------|------|----------|
| `name` | string | yes |
| `client` | string | yes |
| `entries[]` | array (min 1) | yes |
| `entries[].clientAngleId` | string (24-hex) | yes |
| `entries[].imageSpecs[]` | array (min 1) | yes |
| `entries[].imageSpecs[].angleTechnicalSpecificationId` | string (24-hex) | yes |
| `entries[].imageSpecs[].namingPattern` | string | yes |

### `PATCH /api/v1/angle-preset/:id`

**Body**: any subset of `name`, `entries[]` (≥ 1 required).

### `DELETE /api/v1/angle-preset/:id`

---

<a id="partner-angle-preset"></a>

## Partner Angle Preset

Read-only public face of the angle preset API. Enriches each preset with nested client angle, base angle, sample/reference images, and **freshly-signed** S3 URLs for definition markdown.

### `GET /api/v1/partner/angle-preset`

**Headers**: `x-api-key` (required).
**Query**: `clientName` (required).

**Response — 200**: see [`API_DOCS.md`](./API_DOCS.md) for the full response schema.

**400** — `clientName` missing or `Client not found: <code>`.

---

<a id="partner-framework"></a>

## Partner Framework

Resolve a client's active production framework configuration. Resolves the matching `FrameworkGroup` for the `(client, gender, season, category)` tuple, looks up its `activeProductionFrameworkVersionId`, and returns the version plus its knowledge fields (with signed CDN URLs), vocabulary, and category registry.

### `GET /api/v1/partner/framework`

**Headers**: `x-api-key` (required).

**Query**

| Field | Type | Required |
|-------|------|----------|
| `client` | string | yes |
| `gender` / `season` / `category` | string | no |

**Response — 200**
```json
{
  "data": {
    "frameworkGroup": {...},
    "frameworkVersion": {...},
    "knowledgeFields": [ { "...": "...", "cdnUrl": "https://..." } ],
    "frameworkVocab": {...},
    "categoryRegistry": {...}
  }
}
```

**400** — client not found, no matching group, or group has no active production version.

See [`framework_fetch.html`](./framework_fetch.html) for the response-shape walkthrough.

---

<a id="utility"></a>

## Utility

### `POST /api/v1/util/retryThumbnails`

Drains the thumbnail retry queue: up to **50** entries, **3** attempts each, processed with concurrency **10**. Invokes the `InitializeThumbnailGeneration` Lambda; deletes entries on success or after the 3rd failed attempt.

**Response — 200**: `{ "success": 0, "failed": 0, "removed": 0 }`

### `POST /api/v1/util/generateSkuDescriptions`

**Fire-and-forget**. Returns `202 Accepted` immediately, then runs the description generator in the background (`setImmediate`).

For each SKU lacking `skuImageDescription` (optionally scoped to one `clientName`), fetches up to 10 of its asset images, calls Gemini Vision to generate description + categorization, sets `skuImageDescription`, `readyForEmbedding=true`, `embeddingDone=false`, and emits `embedding-sync`. Failures are logged but not returned. Batch size 50, concurrency 20.

**Body**: `{ "clientName"?: "..." }`.
**Response — 202**: `{ "accepted": true, "clientName": null | "...", "startedAt": "2026-06-12T10:00:00.000Z" }`

### `POST /api/v1/util/reindexEmbeddings`

Synchronously walks every SKU where `readyForEmbedding=true && embeddingDone=false` (optionally per `clientName`). For each, generates the normal + partner embeddings, upserts to the vector store (with metadata), and sets `embeddingDone=true`. Batch 100, concurrency 100, cursor-based to bound memory.

**Body**: `{ "clientName"?: "..." }`.
**Response — 200**: `{ "processed": 0, "failed": 0 }`

---

<a id="api-docs"></a>

## API Docs

Serves the contents of the `API_DOCS/` directory at runtime.

### `GET /api/v1/api-docs`

List available files.

### `GET /api/v1/api-docs/:name`

Fetch one file by name.

**Path**: `name` must match `/^[\w.-]+\.(html|md)$/i`.

---

## Notes for contributors

- Every new route must ship a request entry in `test/<routeName>.http` (VS Code REST Client).
- Models are registered via `addModel()` (named Mongoose connection), never `mongoose.model()`.
- CSV ingest stores raw rows in `csv.csvData` — there are no hardcoded column mappings; `csvConfig` only governs validation and source aliasing.
- Image / definition URLs returned by partner endpoints are signed (definition URLs expire in 7 days; image URLs per CloudFront config).
- Two embedding columns exist in the vector store — a "normal" one used by `/asset/semanticSearch` and `/sku` partners' internal flows, and a **partner** column used by `*/semanticSearchPartner` endpoints.
