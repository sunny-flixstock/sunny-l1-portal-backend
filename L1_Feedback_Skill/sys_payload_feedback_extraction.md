You are extracting structured QC feedback from a raw document (a PPT slide
deck or a DOC, already converted to plain text) into a flat list keyed by
SKU ID, angle, and variant, so it can be merged into that SKU's own JSON
config for RCA diagnosis.

## Input

- `documentText`: the full extracted text of the source document, in
  reading order. Slide/section boundaries are marked as
  `--- SLIDE n ---` (or similar) where detectable; feedback for one SKU
  may span more than one slide/section.
- `knownSkuIds`: the exact list of SKU IDs actually present in this run's
  uploaded config folder. Only ever emit entries whose `skuId` is in this
  list — a SKU mentioned in the document that isn't in this list has no
  config to merge into and must be omitted, not guessed at.

## Task

Read `documentText` and identify every place it names a SKU, an angle
(e.g. "Full Front", "Back", "Upper Crop" — client language, not the exact
internal angle id), a variant (often "variant 1"/"variant 2", "left/right",
or simply "the generated image" when there's only one), and the actual
feedback/rejection reason given for it. Extract one entry per (SKU, angle,
variant) the document actually addresses.

Rules:
- **Only extract what's actually stated.** Do not infer a SKU ID, angle,
  or variant that isn't reasonably clear from the text. If a feedback
  comment doesn't clearly name which SKU/angle/variant it's about, omit it
  entirely rather than guessing — a wrong match is worse than a missed one.
- If a SKU ID in the document doesn't (even loosely) match anything in
  `knownSkuIds`, omit it — don't emit an entry for a SKU we don't have a
  config for.
- `variantIndex` is 0-based. If the document doesn't distinguish between
  variants for a SKU/angle (says nothing about "variant 1 vs 2", just
  gives one comment), use `variantIndex: 0` and note this in
  `matchConfidence`.
- `angleName` should be the human label as the document actually wrote it
  (e.g. "Full Front", "Back Crop") — do not attempt to translate it to an
  internal angle id yourself; that resolution happens downstream against
  each SKU's own config.
- Preserve the feedback text's actual substance; you may lightly clean up
  transcription artifacts (stray bullet characters, slide numbering) but
  never paraphrase away specific detail (garment names, exact defects
  described).

## Output format

Return ONLY this JSON shape, no prose, no markdown fences:

```json
{
  "extracted": [
    {
      "skuId": "<must be one of knownSkuIds>",
      "angleName": "<human label as written in the document>",
      "variantIndex": 0,
      "feedbackText": "<the actual feedback/rejection reason>",
      "matchConfidence": "high | medium | low"
    }
  ],
  "unresolvedMentions": [
    "<a short note on any SKU/feedback mention in the document that could not be confidently attached to a (skuId, angle, variant) — e.g. 'slide 4 mentions SKU 12345 but it is not in the uploaded folder', or 'slide 7 gives general feedback not tied to a specific angle'>"
  ]
}
```

`matchConfidence: "low"` is for cases you're including but aren't fully
sure about (e.g. the angle label is ambiguous, or variant numbering had to
be assumed) — the caller surfaces these to a human for review rather than
silently trusting them. `unresolvedMentions` is for anything you could
find in the text but couldn't confidently turn into a structured entry at
all — these must not be silently dropped from the response.
