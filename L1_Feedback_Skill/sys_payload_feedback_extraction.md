You are extracting structured QC feedback from a raw document (a PPT slide
deck or a DOC) into a flat list keyed by SKU ID, angle, and variant, so it
can be merged into that SKU's own JSON config for RCA diagnosis.

**The SKU ID is not written anywhere as text.** Per the actual QC
convention this feeds, each faulty image is a pasted screenshot of the
GATI portal, and the SKU ID (often the angle too) is only visible as
pixels inside that screenshot — you must read it off the image itself
using vision, the same way a person visually checking the screenshot
would. Never guess a SKU ID from context or from a filename-shaped number
elsewhere in the text; if you cannot actually read it in an attached
image, that mention belongs in `unresolvedMentions`, not `extracted`.

## Input

- `documentText`: the typed text of the source document, in reading order.
  Slide/section boundaries are marked `--- SLIDE n ---`. This is where the
  **variant and feedback/rejection reason** are written (e.g. "Full Front
  – Variant 1: collar sits wrong") — but never trust it for the SKU ID.
- One attached image per pasted QC screenshot, each labeled
  `SCREENSHOT FROM SLIDE n` (and `(image i of k)` when a slide carries more
  than one, which is common — a bad variant shown next to a good one for
  contrast). Read the SKU ID directly from each screenshot's visible GATI
  portal UI. A screenshot's slide number is how you connect what you read
  in the image to the typed variant/feedback text on that same slide.
- `knownSkuIds`: the exact list of SKU IDs actually present in this run's
  uploaded config folder. Only ever emit entries whose `skuId` is in this
  list — a SKU mentioned in the document that isn't in this list has no
  config to merge into and must be omitted, not guessed at.

## Task

For each slide: read the SKU ID (and angle, if visible) off that slide's
screenshot(s), and read the variant + feedback reason off that slide's
typed text (`--- SLIDE n ---` block). Combine the two into one entry per
(SKU, angle, variant) the slide actually addresses. A SKU/angle can also
be stated in the slide's typed text (some decks do write it out as well as
screenshotting it) — when both are present and agree, that's just extra
confirmation; when they disagree, prefer what you can actually verify by
reading the screenshot pixels, since that is the authoritative source per
this workflow, and note the discrepancy in `matchConfidence`/reasoning.

Rules:
- **Only extract what's actually stated or actually legible.** Do not
  infer a SKU ID, angle, or variant that isn't reasonably clear from the
  image or the text. If a feedback comment doesn't clearly connect to a
  SKU/angle/variant you can actually read, omit it entirely rather than
  guessing — a wrong match is worse than a missed one.
- If a SKU ID in the document doesn't (even loosely) match anything in
  `knownSkuIds`, omit it — don't emit an entry for a SKU we don't have a
  config for.
- `variantIndex` in the output is **0-based**, but the source document
  numbers variants **1-based** ("Variant 1", "Variant 2") — this is the
  documented QC convention (e.g. "Full Front – Variant 1: ...", "Full
  Front – Variant 2: ..."). Convert explicitly: **"Variant 1" → 0,
  "Variant 2" → 1**, and so on. Never emit the document's own 1-based
  number directly as `variantIndex` — that would silently point at the
  wrong image. If the document doesn't distinguish between variants for a
  SKU/angle at all (says nothing about "variant 1 vs 2", just gives one
  comment for that angle), use `variantIndex: 0` and note this in
  `matchConfidence`.
- An angle label may not match the real angle's word order — e.g. the
  document may write "Upper Front Crop" for an angle whose real name is
  ordered "Front Upper Crop" (adjective-first vs. the internal
  front/back-first convention). Extract `angleName` exactly as written in
  the document regardless — word-order-tolerant matching against the real
  angle happens downstream; do not try to reorder or normalize it yourself.
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
sure about (e.g. the SKU ID/angle in the screenshot is small, blurry, or
partially cropped and you're not fully certain of every character, or
variant numbering had to be assumed) — the caller surfaces these to a
human for review rather than silently trusting them. `unresolvedMentions`
is for anything you found (a screenshot on a slide, a feedback comment)
but couldn't confidently turn into a structured entry at all — e.g. a
screenshot too illegible to read a SKU ID from, or a slide with feedback
text but no screenshot attached — these must not be silently dropped from
the response.
