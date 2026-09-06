# Styling Library — v6

**v6 build notes:** Synthesized from `v1_framework` (last confirmed-good styling baseline) plus `GROUND_TRUTH_FINDINGS.md`, `GROUND_TRUTH_2_FINDINGS.md`, and `RCA_LOG.md`. Per Sunny's own expectation, this file needed far fewer changes than posing.md — most rules below are untouched. One substantive addition: **`co_worn_garment_never_bare`** (new, addresses the "phantom shirtless" bug directly — see its note). All `upper_crop`/`lower_crop` references renamed to `front_upper_crop`/`front_lower_crop` for consistency with the v6 posing files — no behavioral change, naming only. **2026-08-29:** after an exhaustive V1/V4→V6 diff found zero sock-related content or routing difference across every version, `sock_provision_gate` and `sock_height_ceiling` were added to `bottom_never_tucked_into_footwear` as a direct, non-role-gated hard constraint against invented/covering socks — see `RCA_LOG.md` for the full investigation and the known limitation (the strongest evidence for this bug still points to the angle-definition files, left untouched per instruction).

## hero_visibility_standard

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

## co_worn_garment_never_bare — NEW 2026-08-27

**Label:** Every Worn Garment Stays On the Model, Regardless of Which Is Hero (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: top, bottom, base_layer, outerwear (any role that is NOT `hero_garment` for this specific job)

**Why this exists — root cause of the "phantom shirtless" defect.** RCA Log Entry 5 and the ground truth deck (slides showing "Upper is missing") both independently confirm a recurring defect: lower-body-focused shots (hero_garment = a bottom) sometimes render the model shirtless — no top at all, bare torso — even though a top was part of the outfit. `hero_visibility_standard` above only guarantees visibility for the garment tagged `hero_garment`; nothing in the pre-v6 file required a **non-hero, co-worn** garment to still be rendered. `inner_layer_visibility` (below) came close but only covered the reverse case — a base layer under a jacket HERO. This left a real, unaddressed gap for the far more common case: a bottom is the hero, a top is co-worn, and nothing explicitly says the top must stay on. `front_lower_crop`'s own angle definition covers "forehead to the floor" — the torso is always in frame at this angle, so this isn't a framing/cropping question; if the top disappears, it disappears from the render itself.

**Params:**

* **presence_guarantee (HARD CONSTRAINT — no exceptions):** every garment actually provided as part of the outfit selection must be rendered as worn, in every shot, regardless of which single garment is tagged `hero_garment` for that job. A bottom-hero shot still shows the co-worn top, fully clothed — never bare chest, never exposed torso. A top-hero shot still shows the co-worn bottom. This holds on every angle (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`) — `front_lower_crop`'s "forehead to floor" coverage means the torso is always in frame and always needs a garment on it.
* **hero_emphasis_without_omission:** the hero garment gets the visual priority and detail treatment per `hero_visibility_standard` — this rule does not compete with that, it just guarantees the *other* garment isn't dropped entirely while the hero gets its emphasis.
* **residual_risk_note:** this closes the content-level gap that could plausibly cause the defect. If the actual root cause is upstream — the co-worn garment's asset simply never being provided to the generation job at all — no styling.md rule can fix that; it would need the asset-provisioning layer fixed directly. Both are worth checking against real generation logs; this rule is the fix for the content-level half of the risk.

***

## garment_length_reference_fidelity

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

## lighting_background_from_identity

**Label:** Lighting & Background From the Identity / Model Reference

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, bottom, outerwear, base_layer

**Params:**

* **lighting_match:** take lighting from the model/identity reference — same soft, even studio lighting, light direction, and colour temperature. Never invent a harder setup, colour cast, or dramatic shadow.
* **background_match:** take the background from the identity reference — same clean, neutral, seamless studio backdrop and tone. Never introduce a different colour, gradient, texture, or prop.
* **consistency_note:** lighting and background stay consistent across all of a SKU's angles (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`), matched to the identity reference.

***

## accessories_and_equipment_scope

**Label:** Accessories & Equipment Provision-Driven Placement (AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: bag, accessory, watches, headwear, glove
* Categories: bags, watches, socks, headwear, sunglasses, gloves

**Accessories are NOT restricted to full-front/mood only, because BZT's own pose library builds entire poses around equipment appearing IN the crops (`shoulder_rested_equipment_carry_pose`, `athletic_prop_carry_pose`, `kneeling_equipment_grip_pose`, etc.). Every accessory and every piece of equipment (club, racket, ball, dumbbell, bag) is STRICTLY PROVISION-DRIVEN — styled only when actually part of the outfit selection / this angle's assets, never invented — and kept minimal: no over-accessorizing, no fashion bags, no stacked jewelry (per `minimal_accessories_authentic_styling`).**

**Params:**

* **adornment_scope (HARD CONSTRAINT, strengthened 2026-08-28):** worn adornment accessories (watch, cap/visor, sunglasses, headband, wristband) are styled on `full_front` (and `full_back` where visible) exactly as the reference shows; never invented if not provided — **and never silently dropped when it IS provided.** Direct evidence from generated output: a sunglasses asset was present in the provided item set for a job, but the generation prompt never mentioned it and the rendered image showed no sunglasses at all — the opposite failure from inventing an item, equally wrong. If an adornment accessory is a genuine, provided asset for this job, it must appear in the output; omitting a real provided item is exactly as much a defect as inventing one that wasn't provided. **Root-cause note:** this specific defect's evidence points to the prompt-assembly layer failing to carry a provided accessory into the prompt at all, not to a gap in this rule's wording (which already said "provision-driven" before this update) — this strengthening is defense-in-depth, not a confirmed fix; see `RCA_LOG.md`.
* **equipment_scope (strengthened 2026-08-28):** hand-held equipment (club, racket, ball, dumbbell, bag) appears on whichever shot type the SELECTED pose entry's own Params place it on — this is governed by the pose library's item-completeness and accessory-carry-outranks-priority rules, not by shot type alone. **A pose entry describing a held item (a water bottle, a bag, a piece of training equipment) is only eligible to be selected as-written when that specific item is an actual provided asset for this job.** If no such item was provided, the selected entry must fall back to its own empty-handed/relaxed-hand alternative — never invent a plausible-sounding prop just because a pose entry's default Params describe holding one. Evidence: a generated prompt described "one hand holding a water bottle equipment piece" for a job whose provided item set contained no bottle or bag asset at all.
* **bag_scope:** a bag is styled on every shot where it's provided and the selected pose entry places it (carried low by the handle, slung on one shoulder, or worn crossbody); never invented if no bag is provided.
* **footwear_note:** footwear is a worn garment, not an accessory — it follows the shot's own framing, unaffected by this rule.

***

## hero_based_tuck_state

**Label:** Hero-Based Waist Styling (shot-governed — AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, bottom, base_layer
* Categories: t-shirts, tank tops, polos, shirts, shorts, sweatpants, trousers, sweatshirts & hoodies

**The waist styling of an upper worn over a bottom is decided by the SHOT TYPE and the HERO garment's role, not by the upper's fit alone. `full_front` and `full_back` are REFERENCE-LED — reproduce exactly the tucked/untucked state the styled reference shows (`item_characteristics`'s `worn_state`). On `front_upper_crop` and `front_lower_crop`: if the HERO is an upper (tee/polo/shirt), it is worn OVER the waistband, hanging loose, its hem level on both sides; if the HERO is a bottom (shorts/sweatpants/trousers), the upper is worn fully INSIDE the waistband so the bottom's waistband and rise read cleanly — the upper is still worn, per `co_worn_garment_never_bare` above, just tucked in rather than left off.**

**Params:**

* **tuck_state:** SHOT- and HERO-governed; describe plainly as tucked-in or untucked-over — never a lopsided, one-sided, or half-in/half-out result (a HARD ERROR).
* **visibility_priority:** an upper worn inside the waistband reveals the hero bottom's waistband/drawstring; an upper worn over the waistband reveals the hero upper's full hem and length.

***

## shirt_tuck_no_half

**Label:** Polos & Shirts — Full Tuck or Full Untuck ONLY, Never Half (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, base_layer
* Categories: shirts, polos

**Params:**

* **tuck_state (exactly one of two clean states):** a collared shirt or polo is always either FULLY TUCKED (hem inside the waistband all the way around) or FULLY UNTUCKED (hem over the waistband, level all the way around). Never one side inside while the other hangs out, never a hem caught or hitched behind the waistband on one side only — a HARD STYLING ERROR.

***

## closed_detail_presentation

**Label:** Closure Integrity for Detail and Crop Shots

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: jackets, sweatshirts & hoodies, vests

**Params:**

* **closure_state:** on `front_upper_crop` and `front_lower_crop` shots, any garment with a zip is worn fully closed unless the entry's own pose Params (e.g. a shoulder-carry or curl pose) require the arm position that naturally leaves it open. On `full_front`/`full_back` the closure is REFERENCE-LED — open if the reference shows it open, closed if closed.
* **visibility_priority:** on a detail-focused crop, one key feature (zip pull, chest pocket, crest, cuff) stays unobstructed by hair or hands.

***

## inner_layer_visibility

**Label:** Base Tee Under a Zipped Hero Outer

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: jackets, sweatshirts & hoodies, vests
* A base tee or tank is also part of the outfit

**Params:**

* **inner_closure_and_state:** on `full_front`/`full_back`, the outer's openness and the base layer's visibility are reproduced exactly from the reference — the base layer is always shown, never dropped to bare skin. On `front_upper_crop`/`front_lower_crop`, the outer is worn closed per `closed_detail_presentation` and the base layer is worn inside the bottom — no inner hem hangs out below the hero's hemline. **This is the jacket-hero instance of the general rule now stated in `co_worn_garment_never_bare` above** — kept as its own entry since it has additional closure-state detail specific to a zipped outer.

***

## sleeve_presence_and_treatment

**Label:** Sleeve-Presence Fidelity + Pose-Led Sleeve State

**Priority:** 3

**Applies when:**

* Roles: hero_garment, top, base_layer
* Categories: t-shirts, shirts, polos, sweatshirts & hoodies

**A garment's sleeve LENGTH is a fixed product property and is never changed: sleeveless stays sleeveless, short stays short, long stays long — never add, extend, or invent a sleeve. The STATE of a genuine long sleeve (worn down vs. pushed up) is pose-led, not fixed: on the still, level entries (`static_full_body_pose`, `athleisure_frontal_standing_pose`) sleeves stay worn DOWN by default; on a Tier-1/Tier-2 dynamic pose whose own Params imply active exertion (`weighted_equipment_curl_pose`, `dynamic_sprint_stride_pose`, `overhead_arms_flex_pose`), a relaxed push-up/roll reflecting real motion is correct and should NOT be forced back down.**

**Params:**

* **sleeve_treatment:** reproduce true sleeve length from `item_characteristics`; state (down/pushed) follows the selected pose's own energy, never forced either way by default.
* **visibility_priority:** the true sleeve length and cuff construction stay identifiable regardless of state.

***

## bottom_never_tucked_into_footwear

**Label:** Bottoms Always Worn OVER Sneakers, Cleats, and Crew Socks — Never Tucked In (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: bottom, hero_garment, footwear
* Categories: sweatpants, trousers, shorts, socks, shoes

**Params:**

* **hem_over_footwear (HARD CONSTRAINT — no exceptions):** a long bottom's leg — sweatpants, trousers, joggers — always falls down and over the sneaker/cleat collar and any crew sock; it is never inserted, stuffed, or tucked into the sock or footwear shaft. This holds on every shot where the leg-to-footwear transition is visible (`full_front`, `full_back`, `front_lower_crop`).
* **sock_provision_gate (HARD CONSTRAINT — no exceptions, added 2026-08-29):** socks/hosiery of any kind are rendered ONLY when a distinct socks/hosiery item is an actual, provided asset for this job. If no such asset was supplied, the ankle/lower-leg shows bare skin or the shoe's own inner liner — never an invented crew sock, ankle sock, ribbed sock, or any other hosiery, regardless of what a shot-type or framing description otherwise implies. This overrides any general footwear-visibility language elsewhere (including angle/framing notes) that isn't itself conditioned on sock provision.
* **sock_height_ceiling (HARD CONSTRAINT — no exceptions, added 2026-08-29):** when a sock asset IS provided and visible, its height must stay strictly below the bottom garment's own hem line at all times — a sock riding up to reach, cover, or overlap the garment's fabric is a hard error, identical in severity to tucking the hem into the sock. The garment's hem is always the outer, visible boundary; the sock stays entirely below it.

***

## streetwear_graphic_visibility

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

## muted_palette_with_bright_accent

**Label:** Muted Base Palette with Bright Accent Colors Only (AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, base_layer, outerwear, bottom, footwear, bag

**Params:**

* **color_blocking_role:** the outfit's BASE palette stays muted and tonal — the bright, saturated, or high-contrast color in a look is used ONLY as an accent (a trim, a color-blocked panel, a sole color, a headband) never as the dominant tone across multiple garments at once.
* **proportion_strategy:** where the garment reference itself is color-blocked or graphic (e.g. `color_blocked_sweatshirt_pairing`), that panel or print IS the permitted accent — it does not also need a second bright garment layered on top of it. Reproduce the reference's actual colors; never add extra bright pieces to "match the energy."
* **formality_signal:** keeps the overall look reading clean and functional rather than loud or costume-like — bright accents read as intentional, not as the whole story.

***

## minimal_accessories_authentic_styling

**Label:** Minimal Accessories, Authentic Presentation (No Overstyling)

**Priority:** 1

**Applies when:**

* Roles: accessory, bag, headwear, watches

**Params:**

* **accessory_emphasis:** keep accessories minimal — a smartwatch, cap, sports socks, or headband is the ceiling, not a starting point. Never stack multiple accessory types onto one shot beyond what's actually provided.
* **exclusion:** no large/fashion handbags, no oversized or stacked jewelry, no heavy or stylized makeup — none of these belong in a sports-performance shot regardless of what's technically in `item_characteristics`; if a provided item reads as a fashion accessory rather than an athletic one, flag it rather than styling it as a statement piece.
* **authenticity_note:** the look should read like a real athlete's kit, not a styled editorial moment — avoid layering in extra styling flourishes (draped extra garments, decorative knotting, prop stacking) beyond what the pose and provided items call for.

***

## contrast_color_repetition

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

## proportional_balance_wide_bottom

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

## proportional_balance_slim_bottom

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

## accessory_color_mirroring

**Label:** Accessory Color Coordination

**Priority:** 6

**Applies when:**

* Roles: bag, footwear, accessory
* Categories: bags, shoes, watches, headwear

**Params:**

* **accessory_emphasis:** where a bag, cap, or watch is provided, its color/material coordinates with the footwear or a chest accent rather than clashing.
* **texture_contrast:** avoid mixing mesh/technical fabric with leather within the same accessory group unless the reference shows it.

***

## metallic_hardware_consistency

**Label:** Unified Hardware Tone

**Priority:** 6

**Applies when:**

* Roles: accessory, bag, footwear, watches
* Categories: bags, shoes, watches

**Params:**

* **accessory_emphasis:** visible metallic/hardware elements (zip pulls, eyelets, watch case, bag hardware) share the same tone where more than one is provided.
* **color_blocking_role:** gold/brass and silver tones are not mixed within a single look unless the reference explicitly shows it.

***

## untucked_polo_over_shorts

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

## tucked_tshirt_with_shorts

**Label:** Clean Tucked T-Shirt With Athletic Shorts

**Priority:** 2

**Applies when:**

* Roles: top, bottom
* Categories: t-shirts, shorts
* Fit: regular, relaxed
* Length: hip-length, above-knee, mid-thigh

**Params:**

* **tuck_state:** neatly tucked into waistband
* **waist_definition:** defined clean waistband with visible athletic drawstring or elastic
* **proportion_strategy:** balanced athletic silhouette emphasizing waist clean lines
* **stacking_behavior:** crew socks paired with low-profile athletic footwear

***

## zipped_fleece_jacket_layering

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

## tucked_tshirt_with_sweatpants

**Label:** Tucked T-Shirt With Technical Sweatpants

**Priority:** 3

**Applies when:**

* Roles: top, bottom
* Categories: t-shirts, sweatpants
* Fit: regular, relaxed, slim
* Length: hip-length, full-length

**Params:**

* **tuck_state:** tucked or loosely tucked into waistband of sweatpants
* **waist_definition:** clean waist transition highlighting technical fabric texture and pocket details
* **proportion_strategy:** relaxed lower volume anchored by a clean tucked upper base layer
* **visibility_priority:** waistband and drawstring detail visible

***

## color_blocked_sweatshirt_pairing

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

## athletic_sock_and_sneaker_pairing

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

## athleisure_hoodie_layering

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

## athletic_tshirt_tuck_or_untuck

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

## matching_tracksuit_set

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

## technical_shorts_and_compression_lining

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

## hoodie_or_jacket_zipped_trousers

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
