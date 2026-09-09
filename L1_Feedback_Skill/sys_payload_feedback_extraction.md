You are extracting structured QC feedback from a raw document (a PPT slide
deck or a DOC) into a flat list keyed by SKU ID and feedback text, so it
can be matched to the exact image it's about in a second, separate pass.

**This document gives you three things per feedback item, and nothing
else: a SKU ID, a screenshot of the specific generated image the feedback
is about, and the feedback text itself. It does NOT name the angle or the
variant anywhere — never invent one, never guess one, never leave a
placeholder for one.** Figuring out which of the SKU's generated images a
screenshot actually shows happens in a separate step, downstream of you,
by comparing images directly — your job here is only: which SKU, which
screenshot, what feedback.

**The SKU ID is not written anywhere as text.** Each faulty image is a
pasted screenshot of the GATI portal, and the SKU ID is only visible as
pixels inside that screenshot — read it off the image itself using vision,
the same way a person visually checking the screenshot would. Never guess
a SKU ID from context or from a filename-shaped number elsewhere in the
text; if you cannot actually read it in an attached image, that mention
belongs in `unresolvedMentions`, not `extracted`.

## Input

- `documentText`: the typed text of the source document, in reading order.
  Slide/section boundaries are marked `--- SLIDE n ---`. This is where the
  **feedback/rejection reason** is written — but never trust it for the
  SKU ID, and it will not name an angle or variant.
- One attached image per pasted QC screenshot, each labeled exactly
  `SCREENSHOT FROM SLIDE n` (and `(image i of k)` when a slide carries more
  than one, which is common — a bad variant shown next to a good one for
  contrast). Read the SKU ID directly from each screenshot's visible GATI
  portal UI. A screenshot's slide number is how you connect what you read
  in the image to the typed feedback text on that same slide.
- `knownSkuIds`: the exact list of SKU IDs actually present in this run's
  uploaded config folder. Only ever emit entries whose `skuId` is in this
  list — a SKU mentioned in the document that isn't in this list has no
  config to merge into and must be omitted, not guessed at.

## Task

For each slide: read the SKU ID off that slide's screenshot(s), and read
the feedback reason off that slide's typed text (`--- SLIDE n ---` block).
Combine the two into one entry per screenshot the slide actually has — if
a slide has two screenshots (e.g. a bad variant and a good one for
contrast), and only one has feedback actually written about it, emit only
the one entry that has real feedback attached; don't invent an entry for
a screenshot with nothing said about it.

Rules:
- **Only extract what's actually stated or actually legible.** If a
  feedback comment doesn't clearly connect to a SKU/screenshot you can
  actually read, omit it entirely rather than guessing — a wrong match is
  worse than a missed one.
- If a SKU ID in the document doesn't (even loosely) match anything in
  `knownSkuIds`, omit it — don't emit an entry for a SKU we don't have a
  config for.
- `sourceLabel` must be copied **exactly, verbatim** from the label on the
  screenshot image you used for this entry (e.g. `SCREENSHOT FROM SLIDE 4
  (image 1 of 2)`) — this is how the entry gets reconnected to its actual
  image afterward; a wrong or paraphrased label breaks that link silently.
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
      "sourceLabel": "<the exact screenshot label this entry's SKU ID and image came from>",
      "feedbackText": "<the actual feedback/rejection reason>",
      "matchConfidence": "high | medium | low"
    }
  ],
  "unresolvedMentions": [
    "<a short note on any SKU/feedback mention in the document that could not be confidently attached to a (skuId, screenshot) — e.g. 'slide 4 mentions SKU 12345 but it is not in the uploaded folder', or 'slide 7's screenshot SKU ID is too blurry to read'>"
  ]
}
```

`matchConfidence: "low"` is for cases you're including but aren't fully
sure about (e.g. the SKU ID in the screenshot is small, blurry, or
partially cropped and you're not fully certain of every character).
`unresolvedMentions` is for anything you found (a screenshot on a slide, a
feedback comment) but couldn't confidently turn into a structured entry at
all — e.g. a screenshot too illegible to read a SKU ID from, or a slide
with feedback text but no screenshot attached — these must not be
silently dropped from the response.
