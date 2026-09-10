# Styling Rules — BZT Male Sports

Styling rules for BZT Male Sports imagery — governs garment visibility, layering, tuck state, accessories, and footwear/sock presentation for every generated shot.

**TUCK MATRIX (machine-read — do not restyle):** the fenced `tuck-matrix` block below is this framework's own statement of how the waist state (tuck) and the leg-over-footwear relation are decided per shot. Indentation is ignored; lists may be written `[a, b]` or as `- item` lines. The rule texts it names (`rules:`) remain the human-readable authority — see those `### rule_id` sections in the Entry Library below; the block only makes them machine-checkable.

```tuck-matrix
version: 1
shot_classes:
  reference_led: [full_front, full_back]
  hero_governed: [front_upper_crop, front_lower_crop]
hero_roles: {upper: fully_out, bottom: fully_in}
category_groups: {upper: [t-shirts, tank tops, shirts, polos, sweatshirts & hoodies], bottom: [shorts, sweatpants, trousers], footwear: [shoes], skip: [jackets]}
skip_hero_categories: [jackets]
waist_vocabulary: standard
hardware_suppression: upper_hero
state_sentences:
  fully_out: "The {hero} is worn over the {bottom}'s waistband, hanging loose with its hem level on both sides."
  fully_in: "The {upper} is worn fully inside the waistband of the {bottom} so the {bottom}'s waistband and rise read cleanly, with no upper fabric over them."
footwear:
  rule: hem_over_footwear
  footwear_types: [sneaker, sock]
  long_bottom_categories: [sweatpants, trousers]
  shots: all
  sentence: "The leg of the {bottom} falls down and over the sneaker/cleat collar and any crew sock; it is never inserted, stuffed, or tucked into the sock or footwear shaft."
rules: [hero_based_tuck_state, shirt_tuck_no_half, bottom_never_tucked_into_footwear, untucked_polo_over_shorts, tucked_tshirt_with_sweatpants, color_blocked_sweatshirt_pairing, hem_logo_never_tucked_in]
```
<!-- The 7 ids above are now backed by real `## id` sections directly below (machine-read duplicates of the corresponding `### id` entries in the Entry Library, condensed to prose only — extract_rule_texts in src/tuck_check/tuck_matrix.py only matches exactly `## rule_id`, two hashes, so the `### id` entries themselves can never be found by it). These 7 sections are grouped consecutively and immediately followed by `## GLOBAL RULES` on purpose: extract_rule_texts captures from a matched `## id` heading up to the next line starting with `## `, so keeping them adjacent with no `### ` entry able to intervene is what keeps each one's extracted text scoped to just its own paragraph — do not separate them or insert other `## `-level headings between them. If any of the 7 corresponding `### id` entries in the Entry Library below is edited, update its mirror here to match. Note on `hero_based_tuck_state`'s hero=upper override below: the tuck-matrix's own `shot_classes`/`hero_roles` fields above still list `full_front`/`full_back` as `reference_led` because the current schema cannot express "reference-led except when hero=upper" — that nuance lives only in this rule's prose (and its Entry Library counterpart below), which is what the tuck validator/editor agents actually read via `rules:`/`extract_rule_texts`. Do not "fix" the YAML fields to try to encode this without first confirming the schema supports it. -->

## hero_based_tuck_state
The waist styling of an upper worn over a bottom is decided by shot type and hero role, not by the upper's fit alone. **Hard override, on every shot type including `full_front`/`full_back`: when the hero is an upper, it is never tucked in — always worn over the waistband, hanging loose, hem level on both sides.** For every other case (hero is a bottom, or the upper in question is a co-worn non-hero garment): on `full_front`/`full_back`, reproduce exactly the tucked/untucked state the styled reference shows; on `front_upper_crop`/`front_lower_crop`, if the hero is a bottom, the upper is worn fully inside the waistband so the bottom's waistband and rise read cleanly. Any tuck-in decision anywhere in this rule is further gated by `hem_logo_never_tucked_in`: a garment with a relevant lower-hem logo/print is never tucked in, regardless of hero role or shot type. Describe the tuck state plainly as tucked-in or untucked-over — never a lopsided, one-sided, or half-in/half-out result. Never write the literal words "waistband" or "drawstring" into the generated image-composition prompt text — describe the visual outcome only (hem position, fabric drape, tucked/untucked state); naming the internal garment-construction term in the final prompt is a hard error, independent of whether the described tuck state itself is correct.

## hem_logo_never_tucked_in
An upper garment — hero or co-worn — that carries a relevant, sell-critical logo or print at or near its lower hem is never tucked in, on any shot type, regardless of what `hero_based_tuck_state` would otherwise select; only fully tucked-out is eligible for that garment. When the upper carries no such lower-hem logo/print, either fully tucked-in or fully tucked-out remains eligible per `hero_based_tuck_state`'s normal logic — never a half/partial tuck either way, per `shirt_tuck_no_half`.

## shirt_tuck_no_half
A collared shirt or polo is always either fully tucked (hem inside the waistband all the way around) or fully untucked (hem over the waistband, level all the way around). Never one side tucked while the other hangs out, and never a hem caught or hitched behind the waistband on one side only.

## bottom_never_tucked_into_footwear
A long bottom's leg (sweatpants, trousers, joggers) always falls down and over the sneaker/cleat collar and any crew sock — it is never inserted, stuffed, or tucked into the sock or footwear shaft. Socks/hosiery are rendered only when actually provided as an asset; when provided, sock height must stay strictly below the bottom garment's hem.

## untucked_polo_over_shorts
A polo shirt styled over athletic shorts is worn untucked, over the bottom's waistband, as a single top layer — not tucked in.

## tucked_tshirt_with_sweatpants
A t-shirt worn with technical sweatpants is tucked or loosely tucked into the sweatpants' waistband — not left hanging over it.

## color_blocked_sweatshirt_pairing
A color-blocked sweatshirt paired with athletic shorts is worn untucked, over the shorts, with its ribbed hem resting at hip level — not tucked in.

---

## GLOBAL RULES

These are client-agnostic generation-quality principles — they hold regardless of category, brand, or shot type.

### Top Enforcement Priority

The ground-contact shadow requirement (P1) is enforced from the Posing file only; it is a camera/lighting concern with no styling-specific content, so it is not duplicated here.

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

### No Visible Text or Measurement Labels On the Image

**Rule:** The generated image should never contain visible text, numbers, or labels of any kind, and no rule in this file should be read as calling for one. If any numeric or proportion-style guidance elsewhere ever causes the generation to produce such text as an unintended side effect, that is tolerable only when it lands entirely in the background/negative space, never overlapping or touching the model, face, hair, garment, or product — text or numbers appearing on the model or garment itself is a hard failure regardless of cause, since the background (unlike the product) is stripped out in the downstream editing pass.

**Why:** Detailed numeric proportion guidance has been observed to occasionally cause the image model to render body-landmark labels as literal on-image text. A background-only occurrence is a recoverable, low-cost side effect; the same defect on the model or garment would corrupt the actual product photo and is never acceptable.

---

## BZT SPORTS — MALE-SPECIFIC RULES

Rules below depend on BZT's own garment/category set and angle vocabulary (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`).

### Garment Length Fidelity

**Rule:** Reproduce every garment's worn length exactly as its flat/mannequin reference shows — never lengthen or shorten a hem. State where each hem falls relative to a body landmark (e.g. "the hoodie hem sits at the high hip," "the shorts hem hits mid-thigh," "the track pant breaks at the ankle"). This holds for every category: a cropped jacket doesn't extend to the low hip, a hip-length tee doesn't become tunic-length, sleeves end exactly where the reference shows. Where a shot's own framing crops below the stated hem, the garment is simply out of frame — within frame it must read at its true reference length.

**Why:** Worn length is a fixed product property; altering it misrepresents the actual garment being sold.

### Garment Construction Symmetry

**Rule:** A garment's construction — shoulder seams, armholes, sleeve set, side seams, and collar — must render symmetrically left-to-right, matching the product/mannequin reference exactly on both sides of the body. Never distort, angle, or reconstruct one shoulder or armhole differently from the other, and never render a seam or construction line as more geometric, sharp, or angular than the reference's actual soft, natural garment structure shows. This holds on every angle and every variant.

**Why:** Confirmed client rejection: a generated shot showed the wearer's right shoulder cut reading as more geometric/angular than a natural athletic garment structure, with the armhole section rendered asymmetrically between the two sides of the body — the same garment construction must never render differently on each side.

### Hero-Governed Tuck State

**Rule:** The tuck state of an upper worn over a bottom is decided by shot type and which garment is hero, not by the upper's fit alone. On `full_front`/`full_back`, reproduce exactly the tucked/untucked state the styled reference shows. On `front_upper_crop`/`front_lower_crop`: if the hero is an upper, it is worn over the waistband, hanging loose with its hem level on both sides; if the hero is a bottom, the upper is worn fully inside the waistband so the bottom's waistband and rise read cleanly — the upper stays worn, per Co-Worn Garments Never Go Bare, just tucked in rather than left off. Tuck state is always described as one clean state — fully tucked or fully untucked — never a lopsided, one-sided, or half-in/half-out result.

**Why:** Tying tuck state to shot type and hero role, rather than leaving it to the upper's fit alone, keeps the hero garment's own defining lines (waistband, hem) legible on every crop without an ambiguous or asymmetric result.

### Collared Shirts & Polos — Full Tuck or Full Untuck Only

**Rule:** A collared shirt or polo is always either fully tucked (hem inside the waistband all the way around) or fully untucked (hem over the waistband, level all the way around). Never one side in while the other hangs out, and never a hem caught or hitched behind the waistband on one side only.

**Why:** A half-tucked result reads as a styling error rather than an intentional look, on a garment category where tuck state is one of the main visible style cues.

### Closure State on Crops

**Rule:** On `front_upper_crop`/`front_lower_crop`, a garment with a zip (jacket, hoodie, vest) is worn fully closed, unless the selected pose entry's own arm position naturally requires it open. On `full_front`/`full_back`, closure is reference-led — open if the reference shows it open, closed if closed. On a detail-focused crop, keep one key feature (zip pull, chest pocket, crest, cuff) unobstructed by hair or hands.

**Why:** Closure state materially changes what of the garment is visible; anchoring it to shot type and pose (rather than leaving it arbitrary) keeps results predictable and consistent with the reference.

### Base Layer Under a Zipped Hero Outer

**Rule:** When a base tee or tank is part of an outfit under a hero jacket/hoodie/vest: on `full_front`/`full_back`, reproduce the outer's openness and the base layer's visibility exactly from the reference — the base layer is always shown, never dropped to bare skin. On `front_upper_crop`/`front_lower_crop`, the outer is worn closed and the base layer is worn inside the bottom, with no inner hem hanging out below the hero's hemline.

**Why:** This is the jacket-hero instance of Co-Worn Garments Never Go Bare — kept as its own rule because a zipped outer adds closure-state detail that the general rule doesn't cover on its own.

### Sleeve Length Is Fixed, Sleeve State Is Pose-Led

**Rule:** A garment's sleeve length is a fixed product property and is never changed — sleeveless stays sleeveless, short stays short, long stays long; never add, extend, or invent a sleeve. The state of a genuine long sleeve (worn down vs. pushed up) is pose-led: on still, level entries, sleeves stay worn down by default; on a dynamic pose whose own params imply active exertion, a relaxed push-up/roll reflecting real motion is correct and should not be forced back down. The true sleeve length and cuff construction stay identifiable regardless of state.

**Why:** Length is a product-fidelity fact; state is a natural consequence of motion. Conflating the two either misrepresents the product or produces static-looking "action" shots.

### Bottoms Always Worn Over Footwear

**Rule:** A long bottom's leg (sweatpants, trousers, joggers) always falls down and over the sneaker/cleat collar and any crew sock — it is never inserted, stuffed, or tucked into the sock or footwear shaft. This holds on every shot where the leg-to-footwear transition is visible.

**Why:** Tucking a hem into footwear is a basic styling error that misrepresents how the garment is actually worn.

### Sock Provision Gate

**Rule:** Socks/hosiery of any kind are rendered only when a distinct socks/hosiery item is an actual, provided asset for the job. If no such asset was supplied, the ankle/lower-leg shows bare skin or the shoe's own inner liner — never an invented crew sock, ankle sock, ribbed sock, or any other hosiery, regardless of what a shot-type or framing description otherwise implies.

**Why:** This is a confirmed, currently-effective fix for a recurring defect where socks were invented despite no sock asset being provided. It overrides any general footwear-visibility language elsewhere that isn't itself conditioned on sock provision.

### Sock Height Ceiling

**Rule:** When a sock asset is provided and visible, its height must stay strictly below the bottom garment's own hem line at all times. A sock riding up to reach, cover, or overlap the garment's fabric is a hard error, identical in severity to tucking the hem into the sock — the garment's hem is always the outer, visible boundary.

**Why:** This is a confirmed, currently-effective fix for a recurring defect where socks rode up to cover the garment hem, obscuring the actual product being shown.

### Chest Graphic, Crest & Logo Fidelity

**Rule:** Whatever chest graphic, crest, or branding a garment actually carries stays visible and unobstructed — carried equipment and raised/crossed arms must never cut through or cover it, and it defers to Hero-Governed Tuck State so a graphic is never cropped by the waistband. Never enlarge a logo, add a second branding placement, or introduce branding the reference doesn't have.

**Why:** This is about not hiding or altering what's actually on the product — never about maximizing or amplifying it.

### Muted Base Palette, Accent Colors Stay Accents

**Rule:** The outfit's base palette stays muted and tonal; any bright, saturated, or high-contrast color is used only as an accent (a trim, a color-blocked panel, a sole color, a headband) — never as the dominant tone across multiple garments at once. Where the garment reference itself is color-blocked or graphic, that panel or print is the permitted accent and does not need a second bright garment layered on top of it; reproduce the reference's actual colors rather than adding extra bright pieces to "match the energy."

**Why:** Keeps the look reading clean and functional rather than loud or costume-like — bright accents read as intentional, not as the whole story.

### Repeated Accent Colors

**Rule:** Where a non-neutral accent color is present (a team color, a sponsor accent, a color-blocked panel), repeat it in at least one other element — e.g., matching sole color to a chest stripe, or a headband to the shorts trim — so it reads as an intentional accent rather than scattered color, guiding the eye across the outfit's focal points without turning the base palette loud.

**Why:** Governs how an accent repeats, distinct from Muted Base Palette above, which governs how much of the look an accent is allowed to dominate.

### Minimal, Authentic Accessorizing in Sport Context

**Rule:** Keep accessories minimal — a smartwatch, cap, sports socks, or headband is the ceiling, not a starting point; never stack multiple accessory types onto one shot beyond what's actually provided. No large/fashion handbags, no oversized or stacked jewelry, no heavy or stylized makeup — none of these belong in a sports-performance shot regardless of what's technically in the item data; a provided item that reads as a fashion accessory rather than an athletic one should be flagged rather than styled as a statement piece. The look should read like a real athlete's kit, not a styled editorial moment.

**Why:** Sport-context authenticity is part of the brand's visual identity; overstyling undercuts it even when every individual item is technically provided.

### Accessory & Equipment Selection Follows the Pose Entry

**Rule:** Hand-held equipment (club, racket, ball, dumbbell, bag) appears on whichever shot the selected pose entry's own params place it on. A pose entry describing a held item is only eligible to be selected as-written when that specific item is an actual provided asset for the job; if not, the selection must fall back to that entry's own empty-handed/relaxed-hand alternative — never invent a plausible-sounding prop because a pose entry's default description holds one. A bag is styled on every shot where it's provided and the selected pose places it (carried low by the handle, slung on one shoulder, or worn crossbody). Worn adornment accessories (watch, cap/visor, sunglasses, headband, wristband) are styled on `full_front` (and `full_back` where visible) exactly as the reference shows — never invented if not provided, and never silently dropped when it is provided. Footwear is a worn garment, not an accessory, and follows the shot's own framing.

**Why:** Omitting a real, provided item is exactly as much a defect as inventing one that wasn't provided — both directions of this failure have been observed in real output.

### Accessory & Hardware Color Coordination

**Rule:** Where a bag, cap, or watch is provided, its color/material coordinates with the footwear or a chest accent rather than clashing; avoid mixing mesh/technical fabric with leather within the same accessory group unless the reference shows it. Visible metallic/hardware elements (zip pulls, eyelets, watch case, bag hardware) share the same tone where more than one is provided — gold/brass and silver are not mixed within a single look unless the reference explicitly shows it.

**Why:** Coordinated accessory color and hardware tone read as an intentional kit; mismatched tones read as an assembly error rather than a styling choice.

### Proportional Balance — Wide/Slim Bottoms

**Rule:** Wide or relaxed-volume bottoms (wide-leg, relaxed, oversized sweatpants/trousers/shorts) are balanced by a fitted, slim, or regular-fit top for a clean athletic taper. Slim or skin-tight bottoms (trousers, leggings) are balanced with a relaxed or regular-fit top to avoid a restricted, skin-tight head-to-toe look, with the top's volume draping naturally over the hips per Hero-Governed Tuck State where reference-led.

**Why:** Deliberate proportion contrast between top and bottom keeps the silhouette athletic and structured rather than shapeless or overly restrictive.

---

## ENTRY LIBRARY

The entries below are the operational rule set — their Priority, Applies-when, and Avoid-when fields drive rule selection and must be read exactly as written. This is the full detail behind the summarized rules above, plus the specific outfit-combination entries that only exist at this level.

### hero_visibility_standard

**Label:** Hero Garment Visibility and Recognition

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: t-shirts, tank tops, shirts, polos, shorts, sweatpants, trousers, sweatshirts & hoodies, jackets

**Avoid when:**

* Roles: base_layer

**Params:**

* **visibility_priority:** the hero product must remain at least 100% visible in standard shots and 70% in layered shop-the-look shots
* **occlusion_avoidance:** hands, equipment (clubs, rackets, balls, bags, dumbbells), and hair must never obscure chest crests, team badges, sponsor branding, collars, or closures
* **formality_signal:** whatever branding the garment actually carries stays identifiable — this is fidelity to the reference, not a licence to enlarge, duplicate, or add branding; avoid excessive branding or oversized visible logos beyond what the reference shows
* **texture_contrast:** garments stay free of unnatural wrinkles, twisting, or bunching outside of what a dynamic pose's own Params call for

***

### co_worn_garment_never_bare

**Label:** Every Worn Garment Stays On the Model, Regardless of Which Is Hero (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: top, bottom, base_layer, outerwear (any role that is NOT `hero_garment` for this specific job)

**Why this rule exists:** a co-worn, non-hero garment could otherwise be rendered as missing entirely — leaving bare skin where a garment should be. `hero_visibility_standard` above only guarantees visibility for the garment tagged `hero_garment`; nothing else requires a non-hero, co-worn garment to still be rendered. `inner_layer_visibility` (below) covers the reverse case — a base layer under a jacket hero — but not the far more common case of a bottom-hero shot with a co-worn top. `front_lower_crop`'s own angle definition covers "forehead to the floor," so the torso is always in frame at this angle — this is a content requirement, not a framing/cropping question.

**Params:**

* **presence_guarantee (HARD CONSTRAINT — no exceptions):** every garment actually provided as part of the outfit selection must be rendered as worn, in every shot, regardless of which single garment is tagged `hero_garment` for that job. A bottom-hero shot still shows the co-worn top, fully clothed — never bare chest, never exposed torso. A top-hero shot still shows the co-worn bottom. This holds on every angle (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`) — `front_lower_crop`'s "forehead to floor" coverage means the torso is always in frame and always needs a garment on it.
* **hero_emphasis_without_omission:** the hero garment gets the visual priority and detail treatment per `hero_visibility_standard` — this rule does not compete with that, it just guarantees the *other* garment isn't dropped entirely while the hero gets its emphasis.

***

### garment_length_reference_fidelity

**Label:** Garment Worn-Length Fidelity to the Reference (AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, bottom, outerwear, base_layer
* Categories: t-shirts, tank tops, shirts, polos, jackets, sweatshirts & hoodies, shorts, sweatpants, trousers

**Params:**

* **worn_length:** reproduce every garment's worn LENGTH exactly as shown in its flat/mannequin reference — do not lengthen or shorten. State where each hem falls relative to a body landmark (e.g. "the hoodie hem sits at the high hip," "the shorts hem hits mid-thigh," "the track pant breaks at the ankle").
* **applies_to_all_categories:** holds for every category — a cropped jacket doesn't extend to the low hip, a hip-length tee doesn't become tunic-length, sleeves end exactly where the reference shows.
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

* Roles: bag, accessory, watches, headwear, glove
* Categories: bags, watches, socks, headwear, sunglasses, gloves

Accessories are NOT restricted to full-front/mood only, because BZT's own pose library builds entire poses around equipment appearing IN the crops (`shoulder_rested_equipment_carry_pose`, `athletic_prop_carry_pose`, `kneeling_equipment_grip_pose`, etc.). Every accessory and every piece of equipment (club, racket, ball, dumbbell, bag) is STRICTLY PROVISION-DRIVEN — styled only when actually part of the outfit selection / this angle's assets, never invented — and kept minimal: no over-accessorizing, no fashion bags, no stacked jewelry (per `minimal_accessories_authentic_styling`).

**Params:**

* **adornment_scope (HARD CONSTRAINT):** worn adornment accessories (watch, cap/visor, sunglasses, headband, wristband) are styled on `full_front` (and `full_back` where visible) exactly as the reference shows; never invented if not provided — and never silently dropped when it IS provided. If an adornment accessory is a genuine, provided asset for this job, it must appear in the output; omitting a real provided item is exactly as much a defect as inventing one that wasn't provided.
* **equipment_scope:** hand-held equipment (club, racket, ball, dumbbell, bag) appears on whichever shot type the SELECTED pose entry's own Params place it on — this is governed by the pose library's item-completeness and accessory-carry-outranks-priority rules, not by shot type alone. A pose entry describing a held item (a water bottle, a bag, a piece of training equipment) is only eligible to be selected as-written when that specific item is an actual provided asset for this job. If no such item was provided, the selected entry must fall back to its own empty-handed/relaxed-hand alternative — never invent a plausible-sounding prop just because a pose entry's default Params describe holding one.
* **full_front_full_back_no_props (HARD CONSTRAINT):** `full_front` and `full_back` are hands-empty only — no hand-held prop, accessory, or piece of training equipment may be styled on these two angles regardless of what any pose entry's Params describe, per the Posing file's own hard ban. The pose library's `full_front`/`full_back` entries have been audited to never place one; this line is a defensive backstop only, in case a future pose entry is added without updating this file. Props remain fully eligible on `front_upper_crop`/`front_lower_crop`.
* **bag_scope:** a bag is styled on every shot where it's provided and the selected pose entry places it (carried low by the handle, slung on one shoulder, or worn crossbody); never invented if no bag is provided.
* **footwear_note:** footwear is a worn garment, not an accessory — it follows the shot's own framing, unaffected by this rule.

***

### hero_based_tuck_state

**Label:** Hero-Based Waist Styling (shot-governed — AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, bottom, base_layer
* Categories: t-shirts, tank tops, polos, shirts, shorts, sweatpants, trousers, sweatshirts & hoodies

The waist styling of an upper worn over a bottom is decided by the SHOT TYPE and the HERO garment's role, not by the upper's fit alone. **Hard override, applies on every shot type including `full_front`/`full_back`: when the HERO garment is an upper (tee/polo/shirt), it is never tucked in — always worn OVER the waistband, hanging loose, its hem level on both sides.** For every other case — the HERO is a bottom, or the garment being tucked is a co-worn (non-hero) upper — `full_front` and `full_back` are REFERENCE-LED, reproducing exactly the tucked/untucked state the styled reference shows (`item_characteristics`'s `worn_state`); on `front_upper_crop` and `front_lower_crop`, if the HERO is a bottom (shorts/sweatpants/trousers), the upper is worn fully INSIDE the waistband so the bottom's waistband and rise read cleanly — the upper is still worn, per `co_worn_garment_never_bare` above, just tucked in rather than left off. Any tuck-in decision anywhere in this rule is further gated by `hem_logo_never_tucked_in` below — a garment with a relevant lower-hem logo/print is never tucked in, regardless of hero role or shot type.

**Params:**

* **tuck_state:** SHOT- and HERO-governed (with the hero-upper override and the logo gate above taking precedence); describe plainly as tucked-in or untucked-over — never a lopsided, one-sided, or half-in/half-out result (a HARD ERROR).
* **visibility_priority:** an upper worn inside the waistband reveals the hero bottom's waistband/drawstring; an upper worn over the waistband reveals the hero upper's full hem and length.

***

### hem_logo_never_tucked_in

**Label:** Lower-Hem Logo/Print Overrides Tuck-In (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, base_layer
* Categories: t-shirts, tank tops, shirts, polos, sweatshirts & hoodies

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
* Categories: shirts, polos

**Params:**

* **tuck_state (exactly one of two clean states):** a collared shirt or polo is always either FULLY TUCKED (hem inside the waistband all the way around) or FULLY UNTUCKED (hem over the waistband, level all the way around). Never one side inside while the other hangs out, never a hem caught or hitched behind the waistband on one side only — a HARD STYLING ERROR.

***

### closed_detail_presentation

**Label:** Closure Integrity for Detail and Crop Shots

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: jackets, sweatshirts & hoodies, vests

**Params:**

* **closure_state:** on `front_upper_crop` and `front_lower_crop` shots, any garment with a zip is worn fully closed unless the entry's own pose Params (e.g. a shoulder-carry or curl pose) require the arm position that naturally leaves it open. On `full_front`/`full_back` the closure is REFERENCE-LED — open if the reference shows it open, closed if closed.
* **visibility_priority:** on a detail-focused crop, one key feature (zip pull, chest pocket, crest, cuff) stays unobstructed by hair or hands.

***

### inner_layer_visibility

**Label:** Base Tee Under a Zipped Hero Outer

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: jackets, sweatshirts & hoodies, vests
* A base tee or tank is also part of the outfit

**Params:**

* **inner_closure_and_state:** on `full_front`/`full_back`, the outer's openness and the base layer's visibility are reproduced exactly from the reference — the base layer is always shown, never dropped to bare skin. On `front_upper_crop`/`front_lower_crop`, the outer is worn closed per `closed_detail_presentation` and the base layer is worn inside the bottom — no inner hem hangs out below the hero's hemline. This is the jacket-hero instance of the general rule stated in `co_worn_garment_never_bare` above — kept as its own entry since it has additional closure-state detail specific to a zipped outer.

***

### sleeve_presence_and_treatment

**Label:** Sleeve-Presence Fidelity + Pose-Led Sleeve State

**Priority:** 3

**Applies when:**

* Roles: hero_garment, top, base_layer
* Categories: t-shirts, shirts, polos, sweatshirts & hoodies

A garment's sleeve LENGTH is a fixed product property and is never changed: sleeveless stays sleeveless, short stays short, long stays long — never add, extend, or invent a sleeve. The STATE of a genuine long sleeve (worn down vs. pushed up) is pose-led, not fixed: on the still, level entries (`static_full_body_pose`, `athleisure_frontal_standing_pose`) sleeves stay worn DOWN by default; on a Tier-1/Tier-2 dynamic pose whose own Params imply active exertion (`weighted_equipment_curl_pose`, `dynamic_sprint_stride_pose`, `shoulder_rested_equipment_carry_pose`), a relaxed push-up/roll reflecting real motion is correct and should NOT be forced back down.

**Params:**

* **sleeve_treatment:** reproduce true sleeve length from `item_characteristics`; state (down/pushed) follows the selected pose's own energy, never forced either way by default.
* **visibility_priority:** the true sleeve length and cuff construction stay identifiable regardless of state.

***

### bottom_never_tucked_into_footwear

**Label:** Bottoms Always Worn OVER Sneakers, Cleats, and Crew Socks — Never Tucked In (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: bottom, hero_garment, footwear
* Categories: sweatpants, trousers, shorts, socks, shoes

**Params:**

* **hem_over_footwear (HARD CONSTRAINT — no exceptions):** a long bottom's leg — sweatpants, trousers, joggers — always falls down and over the sneaker/cleat collar and any crew sock; it is never inserted, stuffed, or tucked into the sock or footwear shaft. This holds on every shot where the leg-to-footwear transition is visible (`full_front`, `full_back`, `front_lower_crop`).
* **sock_provision_gate (HARD CONSTRAINT — no exceptions):** socks/hosiery of any kind are rendered ONLY when a distinct socks/hosiery item is an actual, provided asset for this job. If no such asset was supplied, the ankle/lower-leg shows bare skin or the shoe's own inner liner — never an invented crew sock, ankle sock, ribbed sock, or any other hosiery, regardless of what a shot-type or framing description otherwise implies. This overrides any general footwear-visibility language elsewhere (including angle/framing notes) that isn't itself conditioned on sock provision.
* **sock_height_ceiling (HARD CONSTRAINT — no exceptions):** when a sock asset IS provided and visible, its height must stay strictly below the bottom garment's own hem line at all times — a sock riding up to reach, cover, or overlap the garment's fabric is a hard error, identical in severity to tucking the hem into the sock. The garment's hem is always the outer, visible boundary; the sock stays entirely below it.

***

### streetwear_graphic_visibility

**Label:** Chest Graphic, Crest, and Logo Fidelity (No Excess Branding)

**Priority:** 2

**Applies when:**

* Roles: hero_garment
* Categories: t-shirts, sweatshirts & hoodies, polos, shirts, jackets
* Pattern: graphic print, logo, team crest, sponsor branding

**Params:**

* **visibility_priority:** whatever chest graphic, crest, or branding the garment actually carries stays visible and unobstructed — this is about not hiding what's really on the product, never about maximizing or amplifying it.
* **occlusion_avoidance:** carried equipment (racket, club, ball, bag) and raised/crossed arms must be positioned so they never cut through or cover a chest crest or logo, per the pose library's occlusion_avoidance params.
* **restraint:** never enlarge a logo, add a second branding placement, or introduce branding the reference doesn't have — excessive branding and oversized visible logos are a styling error, not a strength.
* **tuck_state:** defers to `hero_based_tuck_state`; where the hero is worn over the waistband, the graphic is never cropped by the waistband.

***

### muted_palette_with_bright_accent

**Label:** Muted Base Palette with Bright Accent Colors Only (AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, base_layer, outerwear, bottom, footwear, bag

**Params:**

* **color_blocking_role:** the outfit's BASE palette stays muted and tonal — the bright, saturated, or high-contrast color in a look is used ONLY as an accent (a trim, a color-blocked panel, a sole color, a headband) never as the dominant tone across multiple garments at once.
* **proportion_strategy:** where the garment reference itself is color-blocked or graphic (e.g. `color_blocked_sweatshirt_pairing`), that panel or print IS the permitted accent — it does not also need a second bright garment layered on top of it. Reproduce the reference's actual colors; never add extra bright pieces to "match the energy."
* **formality_signal:** keeps the overall look reading clean and functional rather than loud or costume-like — bright accents read as intentional, not as the whole story.

***

### minimal_accessories_authentic_styling

**Label:** Minimal Accessories, Authentic Presentation (No Overstyling)

**Priority:** 1

**Applies when:**

* Roles: accessory, bag, headwear, watches

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

* **color_blocking_role:** where a non-neutral accent color is present (a team color, a sponsor accent, a color-blocked panel), repeat it in at least one other element — e.g., matching sole color to a chest stripe, or a headband to the shorts trim — so it reads as an intentional accent, not scattered color. This governs HOW the accent repeats; `muted_palette_with_bright_accent` governs how much of the look it's allowed to dominate.
* **proportion_strategy:** uses the repeated accent to guide the eye across the outfit's focal points (chest, waist, footwear) without turning the base palette loud.

***

### proportional_balance_wide_bottom

**Label:** Balanced Proportions: Wide Bottom with Fitted Top

**Priority:** 4

**Applies when:**

* Roles: top, bottom
* Categories: sweatpants, trousers, shorts
* Fit: wide-leg, relaxed, oversized

**Conflicts with:** proportional_balance_slim_bottom

**Params:**

* **proportion_strategy:** wide or relaxed-volume bottoms are balanced by a fitted, slim, or regular-fit top so the silhouette stays athletic and structured, not shapeless.
* **silhouette_contribution:** creates a clean athletic taper rather than a head-to-toe oversized look.

***

### proportional_balance_slim_bottom

**Label:** Balanced Proportions: Slim Bottom with Relaxed Top

**Priority:** 4

**Applies when:**

* Roles: top, bottom
* Categories: trousers, leggings
* Fit: slim, skin-tight, fitted

**Conflicts with:** proportional_balance_wide_bottom

**Params:**

* **proportion_strategy:** slim/fitted bottoms are balanced with a relaxed or regular-fit top to avoid a restricted, skin-tight head-to-toe look.
* **hem_treatment:** defers to `hero_based_tuck_state`; where reference-led, the top's volume drapes naturally over the hips.

***

### accessory_color_mirroring

**Label:** Accessory Color Coordination

**Priority:** 6

**Applies when:**

* Roles: bag, footwear, accessory
* Categories: bags, shoes, watches, headwear

**Params:**

* **accessory_emphasis:** where a bag, cap, or watch is provided, its color/material coordinates with the footwear or a chest accent rather than clashing.
* **texture_contrast:** avoid mixing mesh/technical fabric with leather within the same accessory group unless the reference shows it.

***

### metallic_hardware_consistency

**Label:** Unified Hardware Tone

**Priority:** 6

**Applies when:**

* Roles: accessory, bag, footwear, watches
* Categories: bags, shoes, watches

**Params:**

* **accessory_emphasis:** visible metallic/hardware elements (zip pulls, eyelets, watch case, bag hardware) share the same tone where more than one is provided.
* **color_blocking_role:** gold/brass and silver tones are not mixed within a single look unless the reference explicitly shows it.

***

### untucked_polo_over_shorts

**Label:** Untucked Polo Shirt Styled Over Athletic Shorts

**Priority:** 2

**Applies when:**

* Roles: top, bottom
* Categories: shirts, polos, shorts
* Fit: regular, slim, relaxed
* Length: hip-length, above-knee, mid-thigh

**Params:**

* **tuck_state:** untucked over bottom waistband
* **layering_position:** single top layer over lower garment
* **silhouette_contribution:** casual athletic proportion with balanced upper and lower volume
* **visibility_priority:** polo collar and chest placket fully visible
* **formality_signal:** sport-luxe casual

***

### tucked_tshirt_with_shorts

**Label:** Clean Tucked T-Shirt With Athletic Shorts

**Priority:** 2

**Applies when:**

* Roles: top, bottom
* Categories: t-shirts, shorts
* Fit: regular, relaxed
* Length: hip-length, above-knee, mid-thigh

**Params:**

* **tuck_state:** neatly tucked into waistband
* **logo_gate:** applies only when the t-shirt has no relevant lower-hem logo/print — see `hem_logo_never_tucked_in`; if it does, use an untucked register instead
* **waist_definition:** defined clean waistband with visible athletic drawstring or elastic
* **proportion_strategy:** balanced athletic silhouette emphasizing waist clean lines
* **stacking_behavior:** crew socks paired with low-profile athletic footwear

***

### zipped_fleece_jacket_layering

**Label:** Zipped Technical Fleece or Hoodie Outerwear Layering

**Priority:** 3

**Applies when:**

* Roles: outerwear, bottom
* Categories: jackets, sweatshirts & hoodies, trousers, sweatpants
* Fit: regular, relaxed
* Length: hip-length, full-length

**Params:**

* **closure_state:** fully zipped to mid-neck or high collar
* **layering_position:** outermost layer worn over base top
* **silhouette_contribution:** clean athletic volume with streamlined vertical line
* **formality_signal:** outdoor casual athleisure

***

### tucked_tshirt_with_sweatpants

**Label:** Tucked T-Shirt With Technical Sweatpants

**Priority:** 3

**Applies when:**

* Roles: top, bottom
* Categories: t-shirts, sweatpants
* Fit: regular, relaxed, slim
* Length: hip-length, full-length

**Params:**

* **tuck_state:** tucked or loosely tucked into waistband of sweatpants
* **logo_gate:** applies only when the t-shirt has no relevant lower-hem logo/print — see `hem_logo_never_tucked_in`; if it does, use an untucked register instead
* **waist_definition:** clean waist transition highlighting technical fabric texture and pocket details
* **proportion_strategy:** relaxed lower volume anchored by a clean tucked upper base layer
* **visibility_priority:** waistband and drawstring detail visible

***

### color_blocked_sweatshirt_pairing

**Label:** Relaxed Color-Blocked Sweatshirt With Athletic Shorts

**Priority:** 4

**Applies when:**

* Roles: top, bottom
* Categories: sweatshirts & hoodies, shorts
* Fit: relaxed, regular
* Length: hip-length, above-knee, mid-thigh

**Params:**

* **tuck_state:** untucked over athletic shorts
* **color_blocking_role:** vibrant color-blocked panels serving as visual focal point with neutral shorts
* **drape_behavior:** natural fleece drape with ribbed hem resting at hip level
* **proportion_strategy:** relaxed voluminous top balanced by clean athletic shorts
* **visibility_priority:** sweatshirt graphics and sleeve detailing fully visible

***

### athletic_sock_and_sneaker_pairing

**Label:** Ribbed Crew Socks With Technical Athletic Footwear

**Priority:** 2

**Applies when:**

* Roles: footwear, socks
* Categories: socks, shoes
* Fit: fitted, regular, standard
* Length: mid-calf, ankle-length

**Params:**

* **stacking_behavior:** ribbed crew socks pulled up neatly to mid-calf above sneaker collar
* **visibility_priority:** socks and technical footwear clearly visible to emphasize sport-luxe aesthetic
* **formality_signal:** active performance-oriented styling
* **color_blocking_role:** neutral tones or color-block soles matching outfit palette

***

### athleisure_hoodie_layering

**Label:** Zip Hoodie Over Base Layering

**Priority:** 2

**Applies when:**

* Roles: outerwear, top
* Categories: sweatshirts & hoodies, t-shirts
* Fit: relaxed, regular
* Length: hip-length

**Params:**

* **layering_position:** zip hoodie worn over base layer t-shirt or technical top
* **closure_state:** zipped halfway or fully zipped for clean athletic utility
* **silhouette_contribution:** balanced athletic upper volume with clean lines
* **proportion_strategy:** hip-length layering piece paired cleanly with bottoms
* **formality_signal:** performance-oriented athleisure aesthetic

***

### athletic_tshirt_tuck_or_untuck

**Label:** Athletic T-Shirt Styling

**Priority:** 3

**Applies when:**

* Roles: top, bottom
* Categories: t-shirts, shorts
* Fit: regular, slim, relaxed
* Length: hip-length, above-knee

**Avoid when:**

* Roles: top
* Categories: t-shirts
* Fit: oversized

**Params:**

* **tuck_state:** neatly tucked or clean untucked over athletic bottoms
* **drape_behavior:** natural drape reflecting technical fabric performance
* **proportion_strategy:** clean athletic silhouette avoiding bulky or overstyled looks
* **formality_signal:** functional sport-luxe
* **visibility_priority:** full garment visibility of both top and shorts

***

### matching_tracksuit_set

**Label:** Monochromatic or Coordinated Technical Tracksuit

**Priority:** 2

**Applies when:**

* Roles: outerwear, bottom
* Categories: sweatshirts & hoodies, sweatpants, jackets
* Fit: regular, relaxed, slim
* Length: full-length, hip-length

**Params:**

* **color_blocking_role:** monochromatic, tonal, or team-coordinated palette maintaining a cohesive top-to-bottom line
* **silhouette_contribution:** cohesive vertical line from top to bottom
* **formality_signal:** unified athleisure performance wear
* **visibility_priority:** technical fabric texture and subtle paneling clearly visible
* **layering_position:** any overshirt/jacket within the set follows `closed_detail_presentation` — reference-led (open or closed exactly as the styled reference shows) on `full_front`/`full_back`, always closed on `front_upper_crop`/`front_lower_crop`

***

### technical_shorts_and_compression_lining

**Label:** Perforated Athletic Shorts Over Compression Liners

**Priority:** 4

**Applies when:**

* Roles: bottom
* Categories: shorts
* Fit: relaxed, regular
* Length: above-knee, thigh-length

**Params:**

* **layering_position:** perforated outer athletic shorts layered over skin-tight compression shorts
* **hem_treatment:** outer shorts ending above knee with compression liner extending slightly past hem
* **functionality_signal:** performance-oriented activewear structure
* **proportion_strategy:** athletic leg exposure balanced with fitted base support

***

### hoodie_or_jacket_zipped_trousers

**Label:** Zipped Hoodie or Jacket With Trousers

**Priority:** 3

**Applies when:**

* Roles: outerwear, top, bottom
* Categories: sweatshirts & hoodies, jackets, trousers
* Fit: relaxed, slim, straight-leg
* Length: hip-length, full-length

**Params:**

* **closure_state:** fully or partially zipped
* **layering_position:** outerwear worn over base layer and paired with trousers
* **silhouette_contribution:** streamlined athleisure profile
* **visibility_priority:** outer jacket or hoodie takes visual precedence
* **proportion_strategy:** matching or neutral-toned coordinated athleisure

***

## NON-NEGOTIABLE GUARDRAILS

Before returning any generated shot, validate it against every checklist item below — each is a hard-error condition, not a stylistic preference.

- [ ] No sock is rendered when no socks/hosiery asset was provided for the job (`sock_provision_gate`, in `bottom_never_tucked_into_footwear`).
- [ ] No provided sock rises above the bottom garment's own hem line (`sock_height_ceiling`, in `bottom_never_tucked_into_footwear`).
- [ ] No co-worn garment (top, bottom, base_layer, or outerwear) is dropped or rendered bare, regardless of which garment is tagged hero (`co_worn_garment_never_bare`, `hero_emphasis_without_omission`).
- [ ] No bottom hem is tucked or stuffed into a sock or footwear shaft (`hem_over_footwear`, in `bottom_never_tucked_into_footwear`).
- [ ] No tuck state is left lopsided, one-sided, or half-in/half-out (`hero_based_tuck_state`, `shirt_tuck_no_half`).
- [ ] No garment's worn length is lengthened or shortened relative to its reference (`garment_length_reference_fidelity`).
- [ ] Garment construction (shoulder seams, armholes, sleeve set, side seams) renders symmetrically left-to-right, matching the reference on both sides (`Garment Construction Symmetry`).
- [ ] No lighting, background, colour cast, or prop is invented instead of matched to the identity reference (`lighting_background_from_identity`).
- [ ] No accessory or equipment item is invented when not provided, and no provided adornment accessory is silently dropped (`accessories_and_equipment_scope`).
- [ ] No branding, logo, or graphic is enlarged, duplicated, or added beyond what the reference shows (`streetwear_graphic_visibility`, `hero_visibility_standard`).
- [ ] No visible text, numbers, or labels appear on the image; any incidental occurrence stays confined to the background, never touching the model or garment (`No Visible Text or Measurement Labels On the Image`).
