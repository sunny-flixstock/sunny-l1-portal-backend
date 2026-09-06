Build a Claude Code skill in this repo called `l1-feedback`. It automates the
GTOM L1-generation RCA (root-cause-analysis) feedback loop: given faulty SKU
renders and QC feedback, it diagnoses the prompt/guidance responsible, proposes
fixes, gets a human to pick one, and applies the approved fix to the real
ground-truth files with date-based versioning.

Reference materials are in `L1_Feedback_Skill/` at the repo root:
- `rca_generic_schema.json` — the approved trace schema (read this first, it's the data model)
- `rca_llm_prompt.md` — the approved RCA diagnosis prompt (use this verbatim for the reasoning step)
- `190375736090.rca_populated.json` / `199062275218.rca_populated.json` — two fully worked example traces, one resolved in a single call, one taking two nested calls. Study these to understand the recursive `RCA_Iteration_N` shape.
- `BZT_Male_Sports_Styling_PROD.md`, `BZT_Male_Sports_Posing_PROD.md`, `BZT_Female_Sports_Styling_PROD.md`, `BZT_Female_Sports_Posing_PROD.md` — the four ground-truth files every fix targets by default.
- `BZT_FULL_FRONT_SPORTS.md`, `BZT_FRONT_UPPER_CROP_SPORTS.md`, `BZT_FULL_BACK_SPORTS.md`, `BZT_FRONT_LOWER__CROP_SPORTS.md` — angle definition files. These are a last resort — see below.

## Data model

**Trace files** — one per SKU, at `L1_Feedback_Skill/traces/<parentSkuId>.json`,
shaped exactly like the two example files. This file is the SKU's entire
history. It is never replaced — only ever loaded and grown deeper. Nesting
depth always equals call number: `RCA_Iteration_0` only ever sits at the top
of a `feedback` object (call 1); `RCA_Iteration_1` only ever sits one level
down inside that call's `approvedFix.feedback` (call 2); `RCA_Iteration_2` one
level deeper still (call 3); and so on. A `feedback` object with nothing to
report is always exactly `{text: null, inferredError: null, inferredFix:
null, RCA_Iteration_0: null}` — one key, never padded with extra null
iteration keys at any depth.

**Framework snapshots** — dated folders at
`L1_Feedback_Skill/framework/framework_<YYYY-MM-DD>/`. Every snapshot always
contains the 4 core files (male/female styling + posing), copied forward from
the most recent prior snapshot whether or not they changed this round. An
angle definition file is only added into a snapshot on the rare occasion a
candidate targets it. Snapshots are immutable once written — a later run
always creates a new dated folder, never edits an old one.

## Workflow

**Step 1 — mechanical population (no LLM reasoning).**
Input: a folder of raw/faulty SKU config JSONs, plus a feedback doc (PPT or
text) mapping SKU ID → angle → variant → feedback text.

For each SKU referenced in the feedback doc:
- If `traces/<parentSkuId>.json` already exists, load it.
- Otherwise build it fresh from the raw SKU config into the shape of
  `rca_generic_schema.json`, filling in everything real (`gender`,
  `genderPreamble`, `groundTruth`, `outfit_assembly_output`,
  `updatedOutfitSelction`, `gtom_L1_output` with real prompts/assets) but
  leaving every variant's `feedback` at the default null shape.
- For each variant named in the feedback doc: find where in that variant's
  `feedback` tree the *next* call belongs (top level if this variant has
  never been rejected before; one level inside the deepest `approvedFix` if
  it has an existing resolved chain that just got new feedback). Set that
  slot's `rework` to `"reject"` and fill in `feedback.text` verbatim from the
  feedback doc. Leave `inferredError`/`inferredFix`/the next `RCA_Iteration_N`
  null — that's step 2's job.
- Save the trace back to `traces/<parentSkuId>.json`.

**Step 2 — RCA reasoning (one LLM call per SKU).**
Run `rca_llm_prompt.md` against each SKU's full trace. Per the prompt: it
covers every variant in that SKU in one call, populates the next-due
`RCA_Iteration_N` for each variant that needs one, prefers `concernedFile:
stylingMd/posingMd` over an angle definition file, and returns the entire
trace back with those blocks filled in. `approvedFix` stays null — that's
the human's job next. Save the result back to `traces/<parentSkuId>.json`.

**Step 3 — HITL markdown.**
Generate one consolidated `L1_Feedback_Skill/review/review_<date>.md` for the
whole batch. One block per flagged variant across every SKU in this run:
SKU ID, angle, variant index, `feedback.text`, `inferredError`, `inferredFix`,
both candidates in full (location/action/detail/rationale/conflictCheck/
confidence), ending in a blank line:

```
Decision:
```

The user fills in `candidate_0`, `candidate_1`, `reject`, or a free-text
custom instruction on that line — either by editing the file directly, or by
telling you in chat which one they picked per issue.

**Step 4 — apply approved fixes.**
For every issue with a decision:
- `reject` → do nothing further; leave that `RCA_Iteration_N` as diagnosed,
  no `approvedFix` yet.
- `candidate_0` / `candidate_1` → apply that candidate's `detail` as an edit
  to the real ground-truth file it targets. Never edit in place: find the
  latest existing `framework_<date>/` folder, copy its 4 core files (and any
  angle files it carries) into a new `framework_<today's date>/` folder, then
  apply the edit(s) inside that new folder only. Regenerate the affected
  variant's `prompt` reflecting the edit, and write the result into the trace
  file as that `RCA_Iteration_N`'s `approvedFix` — a full variant-shaped
  object (`candidateId`, `variantIndex`, new `prompt`, new `output` — leave
  as a placeholder path since no render has actually run — `image_description:
  null`, `rework: "none"`, `feedback` null-filled), per the recursive design
  in the example traces.
- A custom free-text instruction → apply that instead of either candidate,
  same placement rules.
- A candidate whose `concernedFile` is `"prompt-composition"` (not a ground-
  truth doc) → do not auto-apply. Report it to the user as needing manual
  handling instead.

**Step 5 — report.**
Summarize what changed: which SKUs/variants were resolved, which files were
edited in which new `framework_<date>/` folder, which issues are still open
or were rejected, and which need manual handling.

## Constraints

- Exactly 2 candidates per `RCA_Iteration_N`, matching the schema fields
  exactly — no extra keys, no missing ones.
- Never invent a quote from a ground-truth file you weren't given — say so in
  `inferredError` instead of guessing.
- Trace files are the sole source of truth for a SKU's iteration history —
  always check for an existing one before treating a SKU as fresh.
- Framework snapshots are append-only — never modify a previous
  `framework_<date>/` folder once written.

Build this as `.claude/skills/l1-feedback/SKILL.md` plus whatever supporting
scripts you need, then tell me what you built and how to invoke it.
