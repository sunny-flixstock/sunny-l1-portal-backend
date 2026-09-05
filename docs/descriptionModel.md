# Description Model API — Machine-Readable Reference

## Constants

- BASE_URL: https://aistylingasset.flixstock.com/api/v1
- AUTH_HEADER: x-api-key
- CONTENT_TYPE: application/json

---

## Entities

### DescriptionModel
Fields:
- modelIdentity: string — primary key, unique, immutable after creation
- name: string
- heightInCM: number (positive)
- isActive: boolean — soft delete flag; default true

### DescriptionModelImage
Fields:
- _id: string (MongoDB ObjectId) — used for update/visibility endpoints
- modelIdentity: string — foreign key, must reference an existing active DescriptionModel
- originalImage: ImageObject — full body image
- croppedImage: ImageObject — face crop of the original image
- cropLocation: object — pixel coordinates of the crop box on the original image
  - x1: number — left edge
  - y1: number — top edge
  - x2: number — right edge
  - y2: number — bottom edge
- isActive: boolean — soft delete flag; default true
- embeddingDone: boolean — false means face embedding is still pending (async)

### ImageObject (shape returned in responses)
```json
{
  "imagePath": {
    "key": "s3-key-string",
    "url": "https://cdn-url",
    "host": "bucket-name",
    "channel": "s3"
  },
  "thumbPath": {
    "key": "s3-thumb-key",
    "url": "https://cdn-thumb-url"
  }
}
```

---

## Image Upload Protocol

All image uploads use a 3-step presign flow. The API never receives image bytes.

### Step 1: Obtain a pre-signed S3 URL
Call the appropriate presign endpoint (see below). Response always contains:
- key: string — S3 object key; pass this back to the API in Step 3
- url: string — pre-signed S3 PUT URL; use this in Step 2
- bucket: string

### Step 2: Upload image to S3
```
PUT {url from Step 1}
Content-Type: image/jpeg
Body: <raw image bytes>
```
No auth headers. A 200 from S3 confirms success.

### Step 3: Pass the key to the API
Use the key from Step 1 as the value of the relevant key field in the API request body.

---

## Endpoints

### POST /description-model
Create a DescriptionModel. modelIdentity must not already exist.

Request body (all fields required):
```json
{
  "modelIdentity": "string",
  "name": "string",
  "heightInCM": 170
}
```

Response 201:
```json
{ "data": { ...DescriptionModel } }
```

Error 400: "A model with identity \"...\" already exists"

---

### GET /description-model
List active DescriptionModels. Paginated.

Query params:
- pageNum: integer, default 1
- pageSize: integer, default 20, max 100

Response 200:
```json
{ "data": [...DescriptionModel], "total": 10, "pageNum": 1, "pageSize": 20 }
```

---

### GET /description-model/:modelIdentity
Get a single active DescriptionModel by its modelIdentity string.

Response 200:
```json
{ "data": { ...DescriptionModel } }
```

Error 400: "DescriptionModel not found"

---

### PUT /description-model/:modelIdentity
Update an active DescriptionModel. modelIdentity cannot be updated.

Request body (at least one field required):
```json
{
  "name": "string",
  "heightInCM": 175
}
```

Response 200:
```json
{ "data": { ...DescriptionModel } }
```

---

### PATCH /description-model/:modelIdentity/visibility
Set isActive on a DescriptionModel.

Request body:
```json
{ "isActive": true }
```

Response 200:
```json
{ "data": { ...DescriptionModel } }
```

---

### POST /description-model/image/presign
Get a pre-signed S3 URL to upload either the original or cropped reference image. Run once per image type.

Request body:
```json
{
  "modelIdentity": "string",
  "fileName": "front.jpg",
  "type": "original"
}
```

Fields:
- modelIdentity: string, required
- fileName: string, required — only the file extension is used; the actual name is discarded
- type: enum["original", "cropped"], required

Response 200:
```json
{
  "data": {
    "key": "descriptionModelReferences/{modelIdentity}/{type}/{uuid}.jpg",
    "url": "https://fxgati.s3.ap-south-1.amazonaws.com/...?<signed-params>",
    "bucket": "fxgati"
  }
}
```

---

### POST /description-model/image
Create a DescriptionModelImage. The modelIdentity must reference an existing active DescriptionModel. Both image keys must already be uploaded to S3 via the presign flow before calling this.

Request body (all fields required):
```json
{
  "modelIdentity": "string",
  "originalImageKey": "descriptionModelReferences/model-001/original/<uuid>.jpg",
  "cropImageKey": "descriptionModelReferences/model-001/cropped/<uuid>.jpg",
  "cropLocation": { "x1": 100, "y1": 50, "x2": 612, "y2": 818 }
}
```

Response 201:
```json
{ "data": { ...DescriptionModelImage } }
```

Side effects:
- Thumbnails generated asynchronously
- Face embedding generated asynchronously (embeddingDone flips to true when done)

Error 400: "No active DescriptionModel found for modelIdentity: ..."

---

### GET /description-model/image/list
List active DescriptionModelImages. Optionally filter by modelIdentity.
Note: `list` is a fixed path segment, not a variable. The path is always `/image/list`.

Query params:
- modelIdentity: string, optional
- pageNum: integer, default 1
- pageSize: integer, default 20, max 100

Response 200:
```json
{ "data": [...DescriptionModelImage], "total": 5, "pageNum": 1, "pageSize": 20 }
```

---

### PUT /description-model/image/:id
Update an active DescriptionModelImage by its _id. At least one field required.

Request body (all optional, at least one required):
```json
{
  "originalImageKey": "string",
  "cropImageKey": "string",
  "cropLocation": { "x1": 0, "y1": 0, "x2": 100, "y2": 100 }
}
```

Response 200:
```json
{ "data": { ...DescriptionModelImage } }
```

Note: updating originalImageKey triggers thumbnail regeneration. Updating cropImageKey additionally resets embeddingDone to false and re-queues face embedding asynchronously.

---

### PATCH /description-model/image/:id/visibility
Set isActive on a DescriptionModelImage by its _id.

Request body:
```json
{ "isActive": false }
```

Response 200:
```json
{ "data": { ...DescriptionModelImage } }
```

---

### POST /description-model/search/presign
Get a pre-signed S3 URL to upload a query face image for search.

Request body:
```json
{ "fileName": "query.jpg" }
```

Response 200:
```json
{
  "data": {
    "key": "descriptionModelReferences/search/{date}/{uuid}.jpg",
    "url": "https://fxgati.s3.ap-south-1.amazonaws.com/...?<signed-params>",
    "bucket": "fxgati"
  }
}
```

---

### POST /description-model/search
Search DescriptionModelImages by face similarity. Upload the query image first using the presign flow.

Request body:
```json
{
  "imageKey": "descriptionModelReferences/search/2026-07-13/<uuid>.jpg",
  "bucket": "fxgati",
  "modelIdentities": ["model-001", "model-002"],
  "pageNum": 1,
  "pageSize": 20
}
```

Fields:
- imageKey: string, required — S3 key of the uploaded query image
- bucket: string, optional, default `"fxgati"` — S3 bucket where the query image lives
- modelIdentities: array of strings, optional — restricts search to these models. Omit, pass `null`, or `[]` to search across all models.
- pageNum: integer, optional, default 1
- pageSize: integer, optional, default 20, max 100

Response 200:
```json
{
  "data": [
    {
      "_id": "string",
      "modelIdentity": "string",
      "modelObj": { "modelIdentity": "string", "name": "string", "heightInCM": 170, "isActive": true },
      "originalImage": { ...ImageObject },
      "croppedImage": { ...ImageObject },
      "cropLocation": { "x1": 100, "y1": 50, "x2": 612, "y2": 818 },
      "isActive": true,
      "embeddingDone": true,
      "similarity": 0.94
    }
  ],
  "total": 8,
  "pageNum": 1,
  "pageSize": 20
}
```

Results ordered by similarity descending. similarity range: 0.0 (no match) to 1.0 (identical).

Key field locations in each result:
- `modelIdentity` — top-level string, identifies which model this image belongs to
- `similarity` — top-level float, the match score against the query image
- `heightInCM` — nested at `modelObj.heightInCM`

---

## Constraints

- modelIdentity is immutable after creation
- A DescriptionModelImage cannot be created if the referenced modelIdentity does not exist or is inactive
- List endpoints only return records where isActive is true
- Deactivating a DescriptionModel does not cascade to its images
