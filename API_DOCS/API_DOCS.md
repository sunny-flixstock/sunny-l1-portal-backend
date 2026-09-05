# Partner Angle Preset API

Read-only API for external frontends to fetch angle presets for a client, including full angle details, reference images, and definition markdown links.

## Base URL

```
/api/v1/partner/angle-preset
```

## Authentication

All requests require a valid partner API key in the `x-api-key` header.

| Header      | Required | Description                          |
|-------------|----------|--------------------------------------|
| `x-api-key` | Yes      | Partner API key from `PARTNER_API_KEYS` |

**401 Unauthorized** — missing or invalid API key:

```json
{ "message": "Invalid or missing API key" }
```

---

## List angle presets for a client

Returns all angle presets for the given client, sorted by most recently updated first. Each preset includes enriched client angles (reference images with CloudFront URLs, definition markdown links), linked base angles (sample images and definition links), and full technical specification details.

### Request

```
GET /api/v1/partner/angle-preset?clientName={clientCode}
```

### Query parameters

| Parameter    | Type   | Required | Description                    |
|--------------|--------|----------|--------------------------------|
| `clientName` | string | Yes      | Client code (e.g. `CLIENT_A`) |

### Example

```http
GET /api/v1/partner/angle-preset?clientName=CLIENT_A HTTP/1.1
x-api-key: your-partner-api-key
```

### Success response — `200 OK`

```json
{
  "data": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "name": "Standard e-commerce pack",
      "client": "CLIENT_A",
      "entries": [
        {
          "clientAngleId": "665f1a2b3c4d5e6f7a8b9c01",
          "clientAngle": {
            "_id": "665f1a2b3c4d5e6f7a8b9c01",
            "name": "Front view",
            "client": "CLIENT_A",
            "seriesKey": "client-a-front",
            "version": 1,
            "status": "active",
            "baseAngleId": "665f1a2b3c4d5e6f7a8b9c02",
            "baseAngleSeriesKey": "front",
            "referenceImages": [
              {
                "name": "reference.jpg",
                "imagePath": {
                  "channel": "s3",
                  "host": "metamodels-ai",
                  "key": "client-angles/CLIENT_A/.../reference.jpg",
                  "url": "https://..."
                },
                "thumbPath": {
                  "key": "thumbs/abc/....webp",
                  "host": "thumb-bucket",
                  "url": "https://..."
                }
              }
            ],
            "definitionStorage": {
              "type": "s3",
              "bucket": "prompt-bucket",
              "key": "client-angles/client-a-front/v1/definition.md",
              "url": "https://..."
            },
            "baseAngle": {
              "_id": "665f1a2b3c4d5e6f7a8b9c02",
              "name": "Front",
              "seriesKey": "front",
              "version": 1,
              "status": "active",
              "sampleImages": [
                {
                  "name": "sample.jpg",
                  "imagePath": { "key": "...", "host": "...", "url": "https://..." },
                  "thumbPath": { "key": "...", "host": "...", "url": "https://..." }
                }
              ],
              "definitionStorage": {
                "type": "s3",
                "bucket": "prompt-bucket",
                "key": "base-angles/front/v1/definition.md",
                "url": "https://..."
              }
            }
          },
          "imageSpecs": [
            {
              "angleTechnicalSpecificationId": "665f1a2b3c4d5e6f7a8b9c03",
              "namingPattern": "${barcode}_front.${ext}",
              "angleTechnicalSpecification": {
                "_id": "665f1a2b3c4d5e6f7a8b9c03",
                "name": "2000x2000 JPEG white",
                "client": "CLIENT_A",
                "dimensions": { "width": 2000, "height": 2000, "dpi": 72 },
                "background": { "color": "#FFFFFF" },
                "fileSpecifications": {
                  "colorMode": "RGB",
                  "fileFormat": "JPEG"
                },
                "specHash": "..."
              }
            }
          ]
        }
      ],
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-06-08T12:00:00.000Z"
    }
  ]
}
```

### Response fields

| Field | Description |
|-------|-------------|
| `data` | Array of angle presets for the client |
| `data[].entries` | Client angles included in the preset |
| `data[].entries[].clientAngle.referenceImages` | Reference images with signed CloudFront URLs on `imagePath.url` and `thumbPath.url` |
| `data[].entries[].clientAngle.definitionStorage` | S3 location and signed URL for the client angle definition markdown |
| `data[].entries[].clientAngle.baseAngle` | Linked base angle with `sampleImages` and `definitionStorage` |
| `data[].entries[].imageSpecs` | Output specs per angle, including naming pattern and technical specification |

### Error responses

| Status | Condition |
|--------|-----------|
| `400` | Missing `clientName` query parameter (validation error) |
| `400` | Client not found: `{ "message": "Client not found: UNKNOWN_CLIENT" }` |
| `401` | Invalid or missing `x-api-key` header |

---

## Notes

- Image URLs and definition markdown URLs are signed and expire (definition URLs: 7 days; image URLs per CloudFront config).
- This endpoint is separate from the internal `/api/v1/angle-preset` CRUD API and is intended for partner/front-office integrations only.
- See `test/partnerAnglePreset.http` for VS Code REST Client examples.
