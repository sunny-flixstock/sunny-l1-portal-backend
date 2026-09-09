# Styling Rules — BZT Female Sports

Styling rules for BZT Female Sports imagery — governs garment visibility, layering, tuck state, accessories, and footwear/sock presentation for every generated shot.

**TUCK MATRIX (machine-read — do not restyle):** the fenced `tuck-matrix` block below is this framework's own statement of how the waist state (tuck) and the leg-over-footwear relation are decided per shot. Indentation is ignored; lists may be written `[a, b]` or as `- item` lines. The rule texts it names (`rules:`) remain the human-readable authority — see those `### rule_id` sections in the Entry Library below; the block only makes them machine-checkable.

```tuck-matrix
version: 1
shot_classes:
  reference_led: [full_front, full_back]
  hero_governed: [front_upper_crop, front_lower_crop]
hero_roles: {upper: fully_out, bottom: fully_in}
category_groups: {upper: [t-shirts, tank tops, sports bras, shirts, sweatshirts & hoodies], bottom: [shorts, leggings, tights, sweatpants, skirts], footwear: [shoes], skip: [jackets]}
skip_hero_categories: [jackets]
waist_vocabulary: standard
hardware_suppression: upper_hero
state_sentences:
  fully_out: "The {hero} is worn over the {bottom}'s waistband, hanging loose with its hem level on both sides."
  fully_in: "The {upper} is worn fully inside the waistband of the {bottom} so the {bottom}'s waistband and rise read cleanly, with no upper fabric over them."
footwear:
  rule: hem_over_footwear
  footwear_types: [sneaker, sock]
  long_bottom_categories: [leggings, tights, sweatpants]
  shots: all
  sentence: "The leg of the {bottom} falls down and over the sneaker collar and any crew sock; it is never inserted, stuffed, or tucked into the sock or footwear shaft."
rules: [hero_based_tuck_state, shirt_tuck_no_half, bottom_never_tucked_into_footwear, tucked_polo_with_mini_skirt, untucked_polo_over_track_pants, hem_logo_never_tucked_in]
```
<!-- The 6 ids above are now backed by real `## id` sections directly below (machine-read duplicates of the corresponding `### id` entries in the Entry Library, condensed to prose only — extract_rule_texts in src/tuck_check/tuck_matrix.py only matches exactly `## rule_id`, two hashes, so the `### id` entries themselves can never be found by it). These 6 sections are grouped consecutively and immediately followed by `## GLOBAL RULES` on purpose: extract_rule_texts captures from a matched `## id` heading up to the next line starting with `## `, so keeping them adjacent with no `### ` entry able to intervene is what keeps each one's extracted text scoped to just its own paragraph — do not separate them or insert other `## `-level headings between them. If any of the 6 corresponding `### id` entries in the Entry Library below is edited, update its mirror here to match. Note on `hero_based_tuck_state`'s hero=upper override below: the tuck-matrix's own `shot_classes`/`hero_roles` fields above still list `full_front`/`full_back` as `reference_led` because the current schema cannot express "reference-led except when hero=upper" — that nuance lives only in this rule's prose (and its Entry Library counterpart below), which is what the tuck validator/editor agents actually read via `rules:`/`extract_rule_texts`. Do not "fix" the YAML fields to try to encode this without first confirming the schema supports it. -->

## hero_based_tuck_state
The waist styling of an upper worn over a bottom is decided by shot type and hero role, not by the upper's fit alone. **Hard override, on every shot type including `full_front`/`full_back`: when the hero is an upper, it is never tucked in — always worn over the waistband, hanging loose, hem level on both sides.** For every other case (hero is a bottom, or the upper in question is a co-worn non-hero garment): on `full_front`/`full_back`, reproduce exactly the tucked/untucked state the styled reference shows; on `front_upper_crop`/`front_lower_crop`, if the hero is a bottom, the upper is worn fully inside the waistband so the bottom's waistband and rise read cleanly. Any tuck-in decision anywhere in this rule is further gated by `hem_logo_never_tucked_in`: a garment with a relevant lower-hem logo/print is never tucked in, regardless of hero role or shot type. Describe the tuck state plainly as tucked-in or untucked-over — never a lopsided, one-sided, or half-in/half-out result. Never write the literal words "waistband" or "drawstring" into the generated image-composition prompt text — describe the visual outcome only (hem position, fabric drape, tucked/untucked state); naming the internal garment-construction term in the final prompt is a hard error, independent of whether the described tuck state itself is correct.

## hem_logo_never_tucked_in
An upper garment — hero or co-worn — that carries a relevant, sell-critical logo or print at or near its lower hem is never tucked in, on any shot type, regardless of what `hero_based_tuck_state` would otherwise select; only fully tucked-out is eligible for that garment. When the upper carries no such lower-hem logo/print, either fully tucked-in or fully tucked-out remains eligible per `hero_based_tuck_state`'s normal logic — never a half/partial tuck either way, per `shirt_tuck_no_half`.

## shirt_tuck_no_half
A collared or sleeveless polo/shirt is always either fully tucked (hem inside the waistband all the way around) or fully untucked (hem over the waistband, level all the way around). Never one side tucked while the other hangs out.

## bottom_never_tucked_into_footwear
A long bottom's leg (sweatpants, joggers, leggings, tights) always falls down and over the sneaker collar and any crew sock — it is never inserted, stuffed, or tucked into the sock or footwear shaft. Socks/hosiery are rendered only when actually provided as an asset; when provided, sock height must stay strictly below the bottom garment's hem.

## tucked_polo_with_mini_skirt
A sleeveless polo paired with a pleated mini skirt is worn neatly tucked into the waistband — not left untucked or over the skirt.

## untucked_polo_over_track_pants
A polo shirt layered over track pants is worn untucked, over the waistband, as the top layer — not tucked in.

---

## GLOBAL RULES

These are client-agnostic generation-quality principles — they hold regardless of category, brand, or shot type.

### Top Enforcement Priorities (P0)

This is this framework's highest-priority check, verified first on every generated variant, ahead of every other rule in this file:
- **P0 — Body-to-face proportion ratio** (enforced from the Posing file, not duplicated here — see `Body-to-Face Proportion Target` below): the 7.25–7.5 crown-to-sole ÷ crown-to-chin target on `full_front`/`full_back`.

(P1 — ground-contact shadow — is enforced from the Posing file only; it is a camera/lighting concern with no styling-specific content, so it is not duplicated here.)

### Hero Garment Visibility

**Rule:** The garment tagged `hero_garment` must remain visible per its shot-type threshold (at least 100% visible in standard shots, at least 70% visible in layered shop-the-look shots), unobstructed by hands, hair, or carried props, and must show only the branding, graphics, or logo scale the reference actually carries — never enlarged, duplicated, or invented.

**Why:** The hero garment is the product being sold; if it is occluded, undersized, or shown with fabricated branding, the image fails its basic purpose regardless of how good the rest of the shot looks.

### Co-Worn Garments Never Go Bare

**Rule:** Every garment actually provided as part of the outfit selection must be rendered as worn, in every shot, regardless of which single garment is tagged `hero_garment` for that job. A bottom-hero shot still shows the co-worn top fully clothed; a top-hero shot still shows the co-worn bottom. This holds on every angle, including crops where the torso or legs are always in frame.

**Why:** Hero emphasis governs visual priority, not permission to omit anything else the model is actually wearing. Without this rule, a shot focused on one hero garment can drop the other provided garment entirely, rendering the model bare where a garment should be.

### Lighting & Background Match the Identity Reference

**Rule:** Take lighting (direction, softness, colour temperature) and background (backdrop colour, texture, tone) directly from the identity/model reference, and keep both consistent across every angle of a SKU. Never invent a different setup, colour cast, dramatic shadow, gradient, texture, or prop.

**Why:** Consistency across a SKU's angles and fidelity to the established identity reference are what make a generated set usable together; an invented lighting or background choice breaks that consistency even if it looks acceptable in isolation.

### Accessories & Equipment Are Strictly Provision-Driven

**Rule:** Style an accessory or piece of equipment only when it is an actual provided asset for the job and the selected pose entry places it there; never invent a plausible-looking item, and never silently drop one that was actually provided. Keep accessorizing minimal — provided items are a ceiling, not a starting point for further styling.

**Why:** Inventing an unprovided item and dropping a provided item are both real, equally serious defects — one adds fiction, the other loses information the client actually supplied. Minimalism keeps the presentation reading as authentic rather than overstyled.

### Body-to-Face Proportion Target

This requirement is enforced from the Posing file only (P0 there) — its build sequence (target band, segment blueprint, circle/oval check, foot-selection cascade) has no styling-specific content, so it is not duplicated here. Styling choices should not work against it: avoid describing a silhouette, layering, or proportion choice that visually compresses or shortens the figure on `full_front`/`full_back`.

### No Visible Text or Measurement Labels On the Image

**Rule:** The generated image should never contain visible text, numbers, or labels of any kind, and no rule in this file should be read as calling for one. If pursuing the body-to-face ratio target above ever causes the generation to produce such text as an unintended side effect, that is tolerable only when it lands entirely in the background/negative space, never overlapping or touching the model, face, hair, garment, or product — text or numbers appearing on the model or garment itself is a hard failure regardless of cause, since the background (unlike the product) is stripped out in the downstream editing pass.

**Why:** Real generation output has shown that detailed numeric proportion guidance can occasionally cause the image model to render body-landmark labels as literal on-image text. A background-only occurrence is a recoverable, low-cost side effect; the same defect on the model or garment would corrupt the actual product photo and is never acceptable.

---

## BZT SPORTS — FEMALE-SPECIFIC RULES

Rules below depend on BZT's own garment/category set and angle vocabulary (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`).

### Garment Length Fidelity

**Rule:** Reproduce every garment's worn length exactly as its flat/mannequin reference shows — never lengthen or shorten a hem. State where each hem falls relative to a body landmark (e.g. "the crop top's hem sits just above the natural waist," "the skirt hem falls at the upper thigh," "the legging breaks at the ankle"). This holds for every category: a cropped tank doesn't lengthen to full torso coverage, a mini skirt doesn't extend to the knee, sleeves end exactly where the reference shows. Where a shot's own framing crops below the stated hem, the garment is simply out of frame — within frame it must read at its true reference length.

**Why:** Worn length is a fixed product property; altering it misrepresents the actual garment being sold.

### Garment Construction Symmetry

**Rule:** A garment's construction — shoulder seams, armholes, sleeve set, side seams, and collar — must render symmetrically left-to-right, matching the product/mannequin reference exactly on both sides of the body. Never distort, angle, or reconstruct one shoulder or armhole differently from the other, and never render a seam or construction line as more geometric, sharp, or angular than the reference's actual soft, natural garment structure shows. This holds on every angle and every variant.

**Why:** Confirmed client rejection: a generated shot showed the wearer's right shoulder cut reading as more geometric/angular than a natural athletic garment structure, with the armhole section rendered asymmetrically between the two sides of the body — the same garment construction must never render differently on each side.

### Hero-Governed Tuck State

**Rule:** The tuck state of an upper worn over a bottom is decided by shot type and which garment is hero, not by the upper's fit alone. On `full_front`/`full_back`, reproduce exactly the tucked/untucked state the styled reference shows. On `front_upper_crop`/`front_lower_crop`: if the hero is an upper (tank/tee/shirt), it is worn over the waistband, hanging loose with its hem level on both sides; if the hero is a bottom (shorts/leggings/skirt), the upper is worn fully inside the waistband so the bottom's waistband and rise read cleanly — the upper stays worn, per Co-Worn Garments Never Go Bare, just tucked in rather than left off. Tuck state is always described as one clean state — fully tucked or fully untucked — never a lopsided, one-sided, or half-in/half-out result.

**Why:** Tying tuck state to shot type and hero role, rather than leaving it to the upper's fit alone, keeps the hero garment's own defining lines (waistband, hem) legible on every crop without an ambiguous or asymmetric result.

### Sleeveless Shirts & Polos — Full Tuck or Full Untuck Only

**Rule:** A collared/sleeveless polo or shirt is always either fully tucked (hem inside the waistband all the way around) or fully untucked (hem over the waistband, level all the way around). Never one side in while the other hangs out.

**Why:** A half-tucked result reads as a styling error rather than an intentional look, on a garment category where tuck state is one of the main visible style cues.

### Closure State on Crops

**Rule:** On `front_upper_crop`/`front_lower_crop`, a garment with a zip (jacket, hoodie, vest) is worn fully closed, unless the selected pose entry's own arm position (e.g. an overhead reach or press) naturally requires it open. On `full_front`/`full_back`, closure is reference-led — open if the reference shows it open, closed if closed. On a detail-focused crop, keep one key feature (zip pull, chest logo, waistband branding) unobstructed by hair or hands.

**Why:** Closure state materially changes what of the garment is visible; anchoring it to shot type and pose (rather than leaving it arbitrary) keeps results predictable and consistent with the reference.

### Base Layer Under a Zipped Hero Outer

**Rule:** When a base tank, tee, or sports bra is part of an outfit under a hero jacket/hoodie/vest: on `full_front`/`full_back`, reproduce the outer's openness and the base layer's visibility exactly from the reference — the base layer is always shown, never dropped to bare skin. On `front_upper_crop`/`front_lower_crop`, the outer is worn closed and the base layer is worn inside the bottom, with no inner hem hanging out below the hero's hemline.

**Why:** This is the jacket-hero instance of Co-Worn Garments Never Go Bare — kept as its own rule because a zipped outer adds closure-state detail that the general rule doesn't cover on its own.

### Sleeve Length Is Fixed, Sleeve State Is Pose-Led

**Rule:** A garment's sleeve length is a fixed product property and is never changed — sleeveless stays sleeveless, short stays short, long stays long; never add, extend, or invent a sleeve. The state of a genuine long sleeve (worn down vs. pushed up) is pose-led: on still, level entries, sleeves stay worn down by default; on a dynamic pose whose own params imply active exertion, a relaxed push-up/roll reflecting real motion is correct and should not be forced back down. The true sleeve length and cuff construction stay identifiable regardless of state.

**Why:** Length is a product-fidelity fact; state is a natural consequence of motion. Conflating the two either misrepresents the product or produces static-looking "action" shots.

### Bottoms Always Worn Over Footwear

**Rule:** A long bottom's leg (sweatpants, joggers, leggings, tights) always falls down and over the sneaker collar and any crew sock — it is never inserted, stuffed, or tucked into the sock or footwear shaft. This holds on every shot where the leg-to-footwear transition is visible.

**Why:** Tucking a hem into footwear is a basic styling error that misrepresents how the garment is actually worn.

### Sock Provision Gate

**Rule:** Socks/hosiery of any kind are rendered only when a distinct socks/hosiery item is an actual, provided asset for the job. If no such asset was supplied, the ankle/lower-leg shows bare skin or the shoe's own inner liner — never an invented crew sock, ankle sock, ribbed sock, or any other hosiery, regardless of what a shot-type or framing description otherwise implies.

**Why:** This is a confirmed, currently-effective fix for a recurring defect where socks were invented despite no sock asset being provided. It overrides any general footwear-visibility language elsewhere that isn't itself conditioned on sock provision.

### Sock Height Ceiling

**Rule:** When a sock asset is provided and visible, its height must stay strictly below the bottom garment's own hem line at all times. A sock riding up to reach, cover, or overlap the garment's fabric is a hard error, identical in severity to tucking the hem into the sock — the garment's hem is always the outer, visible boundary.

**Why:** This is a confirmed, currently-effective fix for a recurring defect where socks rode up to cover the garment hem, obscuring the actual product being shown.

### Muted Base Palette, Accent Colors Stay Accents

**Rule:** The outfit's base palette stays muted and tonal; any bright, saturated, or high-contrast color is used only as an accent (a trim, a color-blocked panel, a sole color, a headband) — never as the dominant tone across multiple garments at once. Where the garment reference itself is color-blocked or graphic, that panel is the permitted accent and does not need a second bright garment layered on top of it; reproduce the reference's actual colors rather than adding extra bright pieces to "match the energy."

**Why:** Keeps the look reading clean and functional rather than loud or costume-like — bright accents read as intentional, not as the whole story.

### Repeated Accent Colors

**Rule:** Where a non-neutral accent color is present, repeat it in at least one other element — e.g., a colour-blocked polo's trim matched to the pleated skirt band, or a sole colour matched to a chest stripe — so it reads as an intentional accent rather than scattered color, guiding the eye across the outfit's focal points without turning the base palette loud.

**Why:** Governs how an accent repeats, distinct from Muted Base Palette above, which governs how much of the look an accent is allowed to dominate.

### Minimal, Authentic Accessorizing in Sport Context

**Rule:** Keep accessories minimal — a smartwatch, cap, sports socks, or headband is the ceiling, not a starting point; never stack multiple accessory types onto one shot beyond what's actually provided. No large/fashion handbags, no oversized or stacked jewelry, no heavy or stylized makeup — none of these belong in a sports-performance shot regardless of what's technically in the item data; a provided item that reads as a fashion accessory rather than an athletic one should be flagged rather than styled as a statement piece. The look should read like a real athlete's kit, not a styled editorial moment.

**Why:** Sport-context authenticity is part of the brand's visual identity; overstyling undercuts it even when every individual item is technically provided.

### Accessory & Equipment Selection Follows the Pose Entry

**Rule:** Hand-held training equipment (ball, dumbbell, band, racket) or a bag appears on whichever shot the selected pose entry's own params place it on. A pose entry describing a held item is only eligible to be selected as-written when that specific item is an actual provided asset for the job; if not, the selection must fall back to that entry's own empty-handed/relaxed-hand alternative — never invent a plausible-sounding prop because a pose entry's default description holds one. A bag is styled on every shot where it's provided and the selected pose places it (carried by the handle, slung on one shoulder, or worn crossbody). Worn adornment accessories (small hoop/stud earrings, cap/visor, sunglasses, watch) are styled on `full_front` (and `full_back` where visible) exactly as the reference shows — never invented if not provided, and never silently dropped when it is provided. Where an earring reference is provided, extract only the jewellery itself — never the reference model's ear, face, hair, or any prop/hand it's photographed against — and place it on this shot's own model, kept small and minimal (studs/small hoops); sports styling never stacks jewellery or uses large/statement pieces. Footwear is a worn garment, not an accessory, and follows the shot's own framing.

**Why:** Omitting a real, provided item is exactly as much a defect as inventing one that wasn't provided — both directions of this failure have been observed in real output.

### Accessory & Hardware Color Coordination

**Rule:** Where a bag, cap, or watch is provided, its color/material coordinates with the footwear or a chest/waistband accent rather than clashing; avoid mixing mesh/technical fabric with leather within the same accessory group unless the reference shows it. Visible metallic/hardware elements (zip pulls, eyelets, watch case, bag hardware, earring metal) share the same tone where more than one is provided — gold and silver are not mixed within a single look unless the reference explicitly shows it.

**Why:** Coordinated accessory color and hardware tone read as an intentional kit; mismatched tones read as an assembly error rather than a styling choice.

### Proportional Balance — Wide/Slim Bottoms

**Rule:** Wide or relaxed-volume bottoms (wide-leg, relaxed, flared sweatpants/trousers/skirts/shorts) are balanced by a fitted, slim, or body-skimming top for a clean athletic taper or A-line. Slim or skin-tight bottoms (leggings, tights, trousers) are balanced with a relaxed or regular-fit top to avoid a restricted, skin-tight head-to-toe look, with the top's volume draping naturally over the hips per Hero-Governed Tuck State where reference-led.

**Why:** Deliberate proportion contrast between top and bottom keeps the silhouette athletic and structured rather than shapeless or overly restrictive.

---

## ENTRY LIBRARY

The entries below are the operational rule set — their Priority, Applies-when, and Avoid-when fields drive rule selection and must be read exactly as written. This is the full detail behind the summarized rules above, plus the specific outfit-combination entries that only exist at this level.

### hero_visibility_standard

**Label:** Hero Garment Visibility and Recognition

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: t-shirts, tank tops, sports bras, shirts, shorts, leggings, tights, sweatpants, sweatshirts & hoodies, jackets, skirts

**Avoid when:**

* Roles: base_layer

**Params:**

* **visibility_priority:** the hero product must remain at least 100% visible in standard shots and 70% in layered shop-the-look shots
* **occlusion_avoidance:** hair, hands, and props (balls, bands, dumbbells, bags) must never obscure necklines, straps, branding, closures, or key design features
* **formality_signal:** whatever logo or print the garment actually carries stays identifiable — this is fidelity to the reference, not a licence to enlarge or add branding; avoid excessive branding or oversized visible logos beyond what the reference shows
* **texture_contrast:** garments stay free of unnatural wrinkles, twisting, or bunching outside of what a dynamic pose's own Params call for

***

### co_worn_garment_never_bare

**Label:** Every Worn Garment Stays On the Model, Regardless of Which Is Hero (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: top, bottom, base_layer, outerwear (any role that is NOT `hero_garment` for this specific job)

**Why this rule exists:** a co-worn, non-hero garment could otherwise be rendered as missing entirely — leaving the model with no top at all even though a top was part of the outfit. `hero_visibility_standard` above only guarantees visibility for the garment tagged `hero_garment`; nothing else requires a non-hero, co-worn garment to still be rendered. `inner_layer_visibility` (below) covers the reverse case — a base tank/bra under a jacket hero — but not the far more common case of a bottom-hero shot with a co-worn top. `front_lower_crop`'s own angle definition covers "forehead to the floor," so the torso is always in frame at this angle — this is a content requirement, not a framing/cropping question.

**Params:**

* **presence_guarantee (HARD CONSTRAINT — no exceptions):** every garment actually provided as part of the outfit selection must be rendered as worn, in every shot, regardless of which single garment is tagged `hero_garment` for that job. A bottom-hero shot still shows the co-worn top (sports bra, tank, tee), fully clothed — never bare torso, never exposed chest. A top-hero shot still shows the co-worn bottom. This holds on every angle (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`) — `front_lower_crop`'s "forehead to floor" coverage means the torso is always in frame and always needs a garment on it.
* **hero_emphasis_without_omission:** the hero garment gets the visual priority and detail treatment per `hero_visibility_standard` — this rule does not compete with that, it just guarantees the *other* garment isn't dropped entirely while the hero gets its emphasis.

***

### garment_length_reference_fidelity

**Label:** Garment Worn-Length Fidelity to the Reference (AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, bottom, outerwear, base_layer
* Categories: t-shirts, tank tops, sports bras, shirts, skirts, jackets, sweatshirts & hoodies, leggings, tights, shorts, sweatpants

**Params:**

* **worn_length:** reproduce every garment's worn LENGTH exactly as shown in its flat/mannequin reference — do not lengthen or shorten. State where each hem falls relative to a body landmark (e.g. "the crop top's hem sits just above the natural waist," "the skirt hem falls at the upper thigh," "the legging breaks at the ankle").
* **applies_to_all_categories:** holds for every category — a cropped tank doesn't lengthen to full torso coverage, a mini skirt doesn't extend to the knee, sleeves end exactly where the reference shows.
* **priority_note:** where a shot's own framing (e.g. `front_upper_crop`) crops below the stated hem, the length is simply out of frame — within frame it must read at its true reference length.

***

### lighting_background_from_identity

**Label:** Lighting & Background From the Identity / Model Reference

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, bottom, outerwear, base_layer

**Params:**

* **lighting_match:** take lighting from the model/identity reference — same soft, even studio lighting, light direction, and colour temperature. Never invent a harder setup, colour cast, or dramatic shadow.
* **background_match:** take the background from the identity reference — same clean, neutral, seamless studio backdrop and tone. Never introduce a different colour, gradient, texture, or prop.
* **consistency_note:** lighting and background stay consistent across all of a SKU's angles (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`), matched to the identity reference.

***

### accessories_and_equipment_scope

**Label:** Accessories & Equipment Provision-Driven Placement (AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: bag, accessory, headwear, jewelry
* Categories: bags, headwear, sunglasses, watches, earrings

Accessories are NOT restricted to full-front/mood only, because BZT's own pose library builds entire poses around equipment appearing IN the crops (`resistance_band_chest_pull_pose`, `bird_dog_kneeling_extension_pose`, `standing_ball_shoulder_hold_pose`, etc.). Every accessory and every piece of training equipment (pilates ball, dumbbell, resistance band, racket, bag, bottle) is STRICTLY PROVISION-DRIVEN — styled only when actually part of the outfit selection / this angle's assets, never invented — and kept minimal: no over-accessorizing, no large fashion handbags, no stacked or heavy jewelry (per `minimal_accessories_authentic_styling`).

**Params:**

* **adornment_scope (HARD CONSTRAINT):** worn adornment accessories (small hoop/stud earrings, cap/visor, sunglasses, watch) are styled on `full_front` (and `full_back` where visible) exactly as the reference shows; never invented if not provided — and never silently dropped when it IS provided. If an adornment accessory is a genuine, provided asset for this job, it must appear in the output; omitting a real provided item is exactly as much a defect as inventing one that wasn't provided.
* **earring_note:** where an earring reference is provided, extract ONLY the jewellery itself — never the reference model's ear, face, hair, or any prop/hand it's photographed against — and place it on this shot's own model. Keep it small and minimal (studs/small hoops) — sports styling never stacks jewellery and never uses large/statement pieces.
* **equipment_scope:** hand-held training equipment (ball, dumbbell, band, racket) or a bag appears on whichever shot type the SELECTED pose entry's own Params place it on — this is governed by the pose library's item-completeness and equipment-carry-outranks-priority rules, not by shot type alone. A pose entry describing a held item (a water bottle, a bag, a piece of training equipment) is only eligible to be selected as-written when that specific item is an actual provided asset for this job. If no such item was provided, the selected entry must fall back to its own empty-handed/relaxed-hand alternative — never invent a plausible-sounding prop just because a pose entry's default Params describe holding one.
* **full_front_full_back_no_props (HARD CONSTRAINT):** `full_front` and `full_back` are hands-empty only — no hand-held prop, accessory, or piece of training equipment may be styled on these two angles regardless of what any pose entry's Params describe, per the Posing file's own hard ban. The pose library's `full_front`/`full_back` entries have been audited to never place one; this line is a defensive backstop only, in case a future pose entry is added without updating this file. Props remain fully eligible on `front_upper_crop`/`front_lower_crop`.
* **bag_scope:** a bag is styled on every shot where it's provided and the selected pose entry places it (carried by the handle, slung on one shoulder, or worn crossbody); never invented if no bag is provided.
* **footwear_note:** footwear is a worn garment, not an accessory — it follows the shot's own framing, unaffected by this rule.

***

### hero_based_tuck_state

**Label:** Hero-Based Waist Styling (shot-governed — AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, bottom, base_layer
* Categories: t-shirts, tank tops, sports bras, shirts, skirts, shorts, leggings, sweatpants, sweatshirts & hoodies

The waist styling of an upper worn over a bottom is decided by the SHOT TYPE and the HERO garment's role, not by the upper's fit alone. **Hard override, applies on every shot type including `full_front`/`full_back`: when the HERO garment is an upper (tank/tee/shirt), it is never tucked in — always worn OVER the waistband, hanging loose, its hem level on both sides.** For every other case — the HERO is a bottom, or the garment being tucked is a co-worn (non-hero) upper — `full_front` and `full_back` are REFERENCE-LED, reproducing exactly the tucked/untucked state the styled reference shows (`item_characteristics`'s `worn_state`); on `front_upper_crop` and `front_lower_crop`, if the HERO is a bottom (shorts/leggings/skirt), the upper is worn fully INSIDE the waistband so the bottom's waistband and rise read cleanly — the upper is still worn, per `co_worn_garment_never_bare` above, just tucked in rather than left off. Any tuck-in decision anywhere in this rule is further gated by `hem_logo_never_tucked_in` below — a garment with a relevant lower-hem logo/print is never tucked in, regardless of hero role or shot type.

**Params:**

* **tuck_state:** SHOT- and HERO-governed (with the hero-upper override and the logo gate above taking precedence); describe plainly as tucked-in or untucked-over — never a lopsided, one-sided, or half-in/half-out result (a HARD ERROR).
* **visibility_priority:** an upper worn inside the waistband reveals the hero bottom's waistband; an upper worn over the waistband reveals the hero upper's full hem and length.

***

### hem_logo_never_tucked_in

**Label:** Lower-Hem Logo/Print Overrides Tuck-In (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, base_layer
* Categories: t-shirts, tank tops, sports bras, shirts, sweatshirts & hoodies

An upper garment — hero or co-worn — that carries a relevant, sell-critical logo or print at or near its lower hem is never tucked in, on any shot type, regardless of what `hero_based_tuck_state` would otherwise select; only fully tucked-out is eligible for that garment. When the upper carries no such lower-hem logo/print, either fully tucked-in or fully tucked-out remains eligible per `hero_based_tuck_state`'s normal logic — never a half/partial tuck either way, per `shirt_tuck_no_half`.

**Params:**

* **tuck_state:** fully tucked-out whenever a relevant lower-hem logo/print is present; otherwise governed by `hero_based_tuck_state`.
* **visibility_priority:** a lower-hem logo/print must remain fully visible and unobstructed by the waistband — this is the reason tucking is disallowed in that case.

***

### shirt_tuck_no_half

**Label:** Polos & Shirts — Full Tuck or Full Untuck ONLY, Never Half (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, base_layer
* Categories: shirts

**Params:**

* **tuck_state (exactly one of two clean states):** a collared/sleeveless polo or shirt is always either FULLY TUCKED (hem inside the waistband all the way around) or FULLY UNTUCKED (hem over the waistband, level all the way around). Never one side inside while the other hangs out — a HARD STYLING ERROR.

***

### closed_detail_presentation

**Label:** Closure Integrity for Detail and Crop Shots

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: jackets, sweatshirts & hoodies, vests

**Params:**

* **closure_state:** on `front_upper_crop` and `front_lower_crop` shots, any garment with a zip is worn fully closed unless the entry's own pose Params (e.g. an overhead reach or press pose) require the arm position that naturally leaves it open. On `full_front`/`full_back` the closure is REFERENCE-LED — open if the reference shows it open, closed if closed.
* **visibility_priority:** on a detail-focused crop, one key feature (zip pull, chest logo, waistband branding) stays unobstructed by hair or hands.

***

### inner_layer_visibility

**Label:** Base Tank/Bra Under a Zipped Hero Outer

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: jackets, sweatshirts & hoodies, vests
* A base tank, tee, or sports bra is also part of the outfit

**Params:**

* **inner_closure_and_state:** on `full_front`/`full_back`, the outer's openness and the base layer's visibility are reproduced exactly from the reference — the base layer is always shown, never dropped to bare skin. On `front_upper_crop`/`front_lower_crop`, the outer is worn closed per `closed_detail_presentation` and the base layer is worn inside the bottom — no inner hem hangs out below the hero's hemline. This is the jacket-hero instance of the general rule stated in `co_worn_garment_never_bare` above — kept as its own entry since it has additional closure-state detail specific to a zipped outer.

***

### sleeve_presence_and_treatment

**Label:** Sleeve-Presence Fidelity + Pose-Led Sleeve State

**Priority:** 3

**Applies when:**

* Roles: hero_garment, top, base_layer
* Categories: t-shirts, shirts, sweatshirts & hoodies

A garment's sleeve LENGTH is a fixed product property and is never changed: sleeveless stays sleeveless, short stays short, long stays long — never add, extend, or invent a sleeve. The STATE of a genuine long sleeve (worn down vs. pushed up) is pose-led: on the still, level entries (`athletic_standard_frontal_stance`, `athleisure_full_body_neutral_stance`) sleeves stay worn DOWN by default; on a Tier-1/Tier-2 dynamic pose whose own Params imply active exertion (`sprint_arm_drive_crop_pose`, or any other entry with a comparable exertion mechanic), a relaxed push-up/roll reflecting real motion is correct and should NOT be forced back down.

**Params:**

* **sleeve_treatment:** reproduce true sleeve length from `item_characteristics`; state (down/pushed) follows the selected pose's own energy, never forced either way by default.
* **visibility_priority:** the true sleeve length and cuff construction stay identifiable regardless of state.

***

### bottom_never_tucked_into_footwear

**Label:** Bottoms Always Worn OVER Sneakers and Crew Socks — Never Tucked In (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: bottom, hero_garment, footwear
* Categories: sweatpants, leggings, tights, socks, shoes

**Params:**

* **hem_over_footwear (HARD CONSTRAINT — no exceptions):** a long bottom's leg — sweatpants, joggers, leggings, tights — always falls down and over the sneaker collar and any crew sock; it is never inserted, stuffed, or tucked into the sock or footwear shaft. This holds on every shot where the leg-to-footwear transition is visible (`full_front`, `full_back`, `front_lower_crop`).
* **sock_provision_gate (HARD CONSTRAINT — no exceptions):** socks/hosiery of any kind are rendered ONLY when a distinct socks/hosiery item is an actual, provided asset for this job. If no such asset was supplied, the ankle/lower-leg shows bare skin or the shoe's own inner liner — never an invented crew sock, ankle sock, ribbed sock, or any other hosiery, regardless of what a shot-type or framing description otherwise implies. This overrides any general footwear-visibility language elsewhere (including angle/framing notes) that isn't itself conditioned on sock provision.
* **sock_height_ceiling (HARD CONSTRAINT — no exceptions):** when a sock asset IS provided and visible, its height must stay strictly below the bottom garment's own hem line at all times — a sock riding up to reach, cover, or overlap the garment's fabric is a hard error, identical in severity to tucking the hem into the sock. The garment's hem is always the outer, visible boundary; the sock stays entirely below it.

***

### proportional_balance_wide_bottom

**Label:** Balanced Proportions: Wide Bottom with Fitted Top

**Priority:** 4

**Applies when:**

* Roles: top, bottom
* Categories: sweatpants, trousers, skirts, shorts
* Fit: wide-leg, relaxed, flared

**Conflicts with:** proportional_balance_slim_bottom

**Params:**

* **proportion_strategy:** wide or relaxed-volume bottoms are balanced by a fitted, slim, or body-skimming top so the silhouette stays athletic and structured, not shapeless.
* **silhouette_contribution:** creates a clean athletic taper or A-line rather than a head-to-toe oversized look.

***

### proportional_balance_slim_bottom

**Label:** Balanced Proportions: Slim Bottom with Relaxed Top

**Priority:** 4

**Applies when:**

* Roles: top, bottom
* Categories: leggings, tights, trousers
* Fit: slim, skin-tight, fitted

**Conflicts with:** proportional_balance_wide_bottom

**Params:**

* **proportion_strategy:** slim/fitted bottoms are balanced with a relaxed or regular-fit top to avoid a restricted, skin-tight head-to-toe look.
* **hem_treatment:** defers to `hero_based_tuck_state`; where reference-led, the top's volume drapes naturally over the hips.

***

### muted_palette_with_bright_accent

**Label:** Muted Base Palette with Bright Accent Colors Only (AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, base_layer, outerwear, bottom, footwear, bag

**Params:**

* **color_blocking_role:** the outfit's BASE palette stays muted and tonal — the bright, saturated, or high-contrast color in a look is used ONLY as an accent (a trim, a color-blocked panel, a sole color, a headband) never as the dominant tone across multiple garments at once.
* **proportion_strategy:** where the garment reference itself is color-blocked or graphic (e.g. `color_blocked_polo_with_pleated_skirt`), that panel IS the permitted accent — it does not also need a second bright garment layered on top of it. Reproduce the reference's actual colors; never add extra bright pieces to "match the energy."
* **formality_signal:** keeps the overall look reading clean and functional rather than loud or costume-like — bright accents read as intentional, not as the whole story.

***

### minimal_accessories_authentic_styling

**Label:** Minimal Accessories, Authentic Presentation (No Overstyling)

**Priority:** 1

**Applies when:**

* Roles: accessory, bag, headwear, jewelry, watches

**Params:**

* **accessory_emphasis:** keep accessories minimal — a smartwatch, cap, sports socks, or headband is the ceiling, not a starting point. Never stack multiple accessory types onto one shot beyond what's actually provided.
* **exclusion:** no large/fashion handbags, no oversized or stacked jewelry, no heavy or stylized makeup — none of these belong in a sports-performance shot regardless of what's technically in `item_characteristics`; if a provided item reads as a fashion accessory rather than an athletic one, flag it rather than styling it as a statement piece.
* **authenticity_note:** the look should read like a real athlete's kit, not a styled editorial moment — avoid layering in extra styling flourishes (draped extra garments, decorative knotting, prop stacking) beyond what the pose and provided items call for.

***

### contrast_color_repetition

**Label:** Intentional Contrast: Repeated Accent Colors

**Priority:** 3

**Applies when:**

* Roles: bag, footwear, accessory, hero_garment

**Avoid when:**

* Palette: monochromatic

**Requires:** muted_palette_with_bright_accent

**Params:**

* **color_blocking_role:** where a non-neutral accent color is present, repeat it in at least one other element — e.g., a colour-blocked polo's trim matched to the pleated skirt band, or a sole colour matched to a chest stripe — so it reads as an intentional accent, not scattered color. This governs HOW the accent repeats; `muted_palette_with_bright_accent` governs how much of the look it's allowed to dominate.
* **proportion_strategy:** uses the repeated accent to guide the eye across the outfit's focal points (chest, waist, footwear) without turning the base palette loud.

***

### accessory_color_mirroring

**Label:** Accessory Color Coordination

**Priority:** 6

**Applies when:**

* Roles: bag, footwear, accessory
* Categories: bags, shoes, watches, headwear

**Params:**

* **accessory_emphasis:** where a bag, cap, or watch is provided, its color/material coordinates with the footwear or a chest/waistband accent rather than clashing.
* **texture_contrast:** avoid mixing mesh/technical fabric with leather within the same accessory group unless the reference shows it.

***

### metallic_hardware_consistency

**Label:** Unified Hardware Tone

**Priority:** 6

**Applies when:**

* Roles: accessory, bag, footwear, jewelry
* Categories: bags, shoes, watches, earrings

**Params:**

* **accessory_emphasis:** visible metallic/hardware elements (zip pulls, eyelets, watch case, bag hardware, earring metal) share the same tone where more than one is provided.
* **color_blocking_role:** gold and silver tones are not mixed within a single look unless the reference explicitly shows it.

***

### cropped_top_untucked_high_waist_bottom

**Label:** Untucked Cropped Top Over High-Waisted Bottoms

**Priority:** 1

**Applies when:**

* Roles: top, bottom
* Categories: t-shirts, tank tops, sports bras, sweatpants, shorts, leggings
* Fit: cropped, relaxed, fitted, slim
* Length: cropped, full-length, micro, mid-thigh

**Params:**

* **tuck_state:** untucked, resting above the waistband
* **layering_position:** crop top worn directly over high-waisted bottoms
* **waist_definition:** defined by the high-waisted waistband meeting the exposed midriff
* **proportion_strategy:** cropped top balanced with high-rise relaxed bottoms
* **visibility_priority:** midriff and high waistband must remain visible

***

### tucked_polo_with_mini_skirt

**Label:** Tucked Sleeveless Polo With Pleated Mini Skirt

**Priority:** 2

**Applies when:**

* Roles: top, bottom, footwear, headwear
* Categories: tops, shirts, skirts, shoes, headwear
* Fit: fitted, slim
* Length: mini, hip-length

**Requires:** shirt_tuck_no_half

**Conflicts with:** cropped_top_untucked_high_waist_bottom

**Params:**

* **tuck_state:** neatly tucked into the waistband
* **logo_gate:** applies only when the polo has no relevant lower-hem logo/print — see `hem_logo_never_tucked_in`; if it does, use an untucked register instead
* **layering_position:** polo tucked into the skirt waistband
* **waist_definition:** clean waist definition at the skirt waistband
* **proportion_strategy:** fitted sleeveless top paired with a flared mini skirt
* **visibility_priority:** waistband and skirt pleats fully visible
* **accessory_emphasis:** minimal athletic accessories like visors and crew socks

***

### tucked_polo_with_athletic_shorts

**Label:** Tucked Polo Shirt With Satin Athletic Shorts

**Priority:** 3

**Applies when:**

* Roles: top, bottom
* Categories: shirts, t-shirts, shorts
* Fit: slim, relaxed
* Length: hip-length, short

**Params:**

* **tuck_state:** fully tucked into the waistband
* **logo_gate:** applies only when the polo has no relevant lower-hem logo/print — see `hem_logo_never_tucked_in`; if it does, use an untucked register instead
* **layering_position:** polo tucked into the shorts waistband
* **waist_definition:** defined waist over athletic shorts
* **proportion_strategy:** tailored polo balanced with relaxed athletic shorts
* **visibility_priority:** shorts waistband and piping clearly visible
* **formality_signal:** polished sport-luxe

***

### athletic_sock_sneaker_layering

**Label:** Mid-Calf Athletic Socks Layered Under Sneakers

**Priority:** 4

**Applies when:**

* Roles: footwear, socks
* Categories: socks, shoes
* Fit: fitted, regular
* Length: mid-calf, low-top, crew, ankle-length

**Params:**

* **layering_position:** crew or mid-calf socks pulled up beneath athletic shoes
* **stacking_behavior:** ribbed athletic crew socks pulled up above the ankle, tucked into sneakers
* **visibility_priority:** sock height visible above the sneaker collar
* **proportion_strategy:** sports socks framing the lower leg with athletic footwear
* **formality_signal:** performance-oriented athleisure styling

***

### track_jacket_untucked_over_skirt

**Label:** Athletic Track Jacket Untucked Over Skirt

**Priority:** 5

**Applies when:**

* Roles: outerwear, bottom
* Categories: sweatshirts & hoodies, jackets, skirts
* Fit: fitted, slim, regular
* Length: hip-length, above-knee, mini

**Params:**

* **tuck_state:** untucked
* **layering_position:** athletic zip top or jacket worn over the skirt base
* **closure_state:** zipped or partially zipped
* **proportion_strategy:** structured athletic top balanced with a clean mini skirt
* **visibility_priority:** jacket hemline and skirt line clearly distinguished

***

### athletic_untucked_tee_over_shorts

**Label:** Untucked Athletic T-Shirt Over Shorts

**Priority:** 1

**Applies when:**

* Roles: top, bottom
* Categories: t-shirts, shorts, skirts, sweatshirts & hoodies
* Fit: relaxed, slim, regular
* Length: hip-length, micro, mid-thigh, above-knee

**Params:**

* **tuck_state:** untucked, worn naturally over the waistband
* **layering_position:** t-shirt worn as the top layer over shorts
* **silhouette_contribution:** balanced athletic proportions with clean vertical lines
* **proportion_strategy:** relaxed or slim top paired with performance-oriented shorts
* **visibility_priority:** t-shirt hem falls naturally below the waist without excessive bulk

***

### zipped_track_jacket_layering

**Label:** Zip-Up Track Jacket Layering Over Athletic Skirt or Leggings

**Priority:** 2

**Applies when:**

* Roles: outerwear, top, bottom, footwear
* Categories: jackets, sweatshirts & hoodies, skirts, leggings, sweatpants, shoes, tops, t-shirts
* Fit: slim, relaxed, regular, cropped, fitted, skin-tight
* Length: hip-length, mini, full-length, cropped

**Params:**

* **closure_state:** partially zipped, fully zipped high collar, or open unzipped
* **layering_position:** track jacket worn as an outer layer over a skirt or leggings, or over an inner base top
* **silhouette_contribution:** structured sporty upper body balanced with clean lower lines
* **formality_signal:** sport-luxe functional aesthetic
* **visibility_priority:** collar, jacket structure, and inner base top clearly visible

***

### tucked_top_with_high_waist_bottom

**Label:** Tucked Top with High-Waisted Bottoms

**Priority:** 2

**Applies when:**

* Roles: top, bottom
* Categories: tops, t-shirts, sweatpants, shorts, leggings
* Fit: fitted, slim, regular
* Length: hip-length, cropped

**Params:**

* **tuck_state:** fully tucked into the waistband of high-rise bottoms
* **logo_gate:** applies only when the top has no relevant lower-hem logo/print — see `hem_logo_never_tucked_in`; if it does, use an untucked register instead
* **layering_position:** base top tucked inside the waistband
* **waist_definition:** accentuates the waistline and the clean separation between upper and lower garments
* **proportion_strategy:** streamlined silhouette emphasizing leg length and waist placement
* **visibility_priority:** waistband and tuck cleanliness must remain visible

***

### untucked_polo_over_track_pants

**Label:** Untucked Polo Shirt Layered Over Track Pants

**Priority:** 5

**Applies when:**

* Roles: top, bottom
* Categories: shirts, sweatpants
* Fit: regular, relaxed
* Length: hip-length, full-length

**Params:**

* **tuck_state:** untucked over the waistband
* **layering_position:** polo shirt worn as the top layer over the track pants
* **silhouette_contribution:** relaxed athletic profile with balanced proportions
* **proportion_strategy:** regular top with relaxed full-length bottoms
* **formality_signal:** sport-luxe casual

***

### cropped_tank_over_high_waist_bottoms

**Label:** Cropped Tank Top With High-Waisted Athletic Bottoms

**Priority:** 4

**Applies when:**

* Roles: top, bottom
* Categories: tops, tank tops, sweatpants, leggings, shorts, skirts
* Fit: fitted, relaxed, wide-leg, slim, cropped
* Length: cropped, full-length

**Params:**

* **tuck_state:** untucked, ending above the waistband
* **waist_definition:** natural midriff exposure meeting high-waisted bottoms
* **proportion_strategy:** cropped top balancing a voluminous or skin-tight lower body
* **silhouette_contribution:** clean athletic vertical line
* **visibility_priority:** high waistband and upper-torso balance

***

### zipped_jacket_over_tank_and_leggings

**Label:** Open Technical Jacket Layered Over Tank Top and Leggings

**Priority:** 4

**Applies when:**

* Roles: outerwear, top, bottom
* Categories: jackets, tops, tank tops, leggings, sweatpants
* Fit: cropped, fitted, skin-tight, slim
* Length: cropped, full-length

**Params:**

* **layering_position:** zip-up jacket worn open as an outer layer over a tucked tank top
* **closure_state:** open, unzipped
* **tuck_state:** inner base tank tucked into the leggings
* **logo_gate:** applies only when the tank has no relevant lower-hem logo/print — see `hem_logo_never_tucked_in`; if it does, leave the tank untucked instead
* **proportion_strategy:** cropped outerwear framing a fitted base layer
* **visibility_priority:** inner tank and high waistline visible beneath the open jacket

***

### color_blocked_polo_with_pleated_skirt

**Label:** Sleeveless Color-Blocked Polo With Pleated Athletic Skirt

**Priority:** 5

**Applies when:**

* Roles: top, bottom
* Categories: tops, skirts, shirts
* Fit: slim, fitted
* Length: hip-length, mini

**Params:**

* **tuck_state:** tucked into the waistband
* **logo_gate:** applies only when the polo has no relevant lower-hem logo/print — see `hem_logo_never_tucked_in`; if it does, use an untucked register instead
* **waist_definition:** defined waist with a wide skirt band
* **proportion_strategy:** slim sleeveless top balanced with a flared mini skirt
* **silhouette_contribution:** classic athletic court silhouette
* **formality_signal:** preppy sport-luxe

***

## NON-NEGOTIABLE GUARDRAILS

Before returning any generated shot, validate it against every checklist item below — each is a hard-error condition, not a stylistic preference.

- [ ] **P0** — Enforced from the Posing file, not this one — see that file's checklist. Styling only avoids describing a silhouette/proportion choice that visually compresses the figure on `full_front`/`full_back` (`Body-to-Face Proportion Target`).
- [ ] No sock is rendered when no socks/hosiery asset was provided for the job (`sock_provision_gate`, in `bottom_never_tucked_into_footwear`).
- [ ] No provided sock rises above the bottom garment's own hem line (`sock_height_ceiling`, in `bottom_never_tucked_into_footwear`).
- [ ] No co-worn garment (top, bottom, base_layer, or outerwear) is dropped or rendered bare, regardless of which garment is tagged hero (`co_worn_garment_never_bare`, `hero_emphasis_without_omission`).
- [ ] No bottom hem is tucked or stuffed into a sock or footwear shaft (`hem_over_footwear`, in `bottom_never_tucked_into_footwear`).
- [ ] No tuck state is left lopsided, one-sided, or half-in/half-out (`hero_based_tuck_state`, `shirt_tuck_no_half`).
- [ ] No garment's worn length is lengthened or shortened relative to its reference (`garment_length_reference_fidelity`).
- [ ] Garment construction (shoulder seams, armholes, sleeve set, side seams) renders symmetrically left-to-right, matching the reference on both sides (`Garment Construction Symmetry`).
- [ ] No lighting, background, colour cast, or prop is invented instead of matched to the identity reference (`lighting_background_from_identity`).
- [ ] No accessory or equipment item is invented when not provided, and no provided adornment accessory (including earrings) is silently dropped (`accessories_and_equipment_scope`).
- [ ] No earring reference carries over the reference model's ear, face, hair, or prop/hand — only the jewellery itself transfers (`earring_note`, in `accessories_and_equipment_scope`).
- [ ] No visible text, numbers, or labels appear on the image; any incidental occurrence stays confined to the background, never touching the model or garment (`No Visible Text or Measurement Labels On the Image`).
