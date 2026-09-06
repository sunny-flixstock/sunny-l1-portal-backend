# Styling Library — v6

**v6 build notes:** Synthesized from `v1_framework` (last confirmed-good styling baseline) plus `GROUND_TRUTH_FINDINGS.md`, `GROUND_TRUTH_2_FINDINGS.md`, and `RCA_LOG.md`. One substantive addition, mirroring the Male file: **`co_worn_garment_never_bare`** (new, addresses the "phantom shirtless" bug — see its note). All `upper_crop`/`lower_crop` references renamed to `front_upper_crop`/`front_lower_crop` for consistency with the v6 posing files — no behavioral change, naming only. **2026-08-29:** after an exhaustive V1/V4→V6 diff found zero sock-related content or routing difference across every version, `sock_provision_gate` and `sock_height_ceiling` were added to `bottom_never_tucked_into_footwear` as a direct, non-role-gated hard constraint against invented/covering socks — see `RCA_LOG.md` for the full investigation and the known limitation (the strongest evidence for this bug still points to the angle-definition files, left untouched per instruction).

## hero_visibility_standard

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

## co_worn_garment_never_bare — NEW 2026-08-27

**Label:** Every Worn Garment Stays On the Model, Regardless of Which Is Hero (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: top, bottom, base_layer, outerwear (any role that is NOT `hero_garment` for this specific job)

**Why this exists — root cause of the "phantom shirtless" defect.** RCA Log Entry 5 and the ground truth deck (slides showing "Upper is missing") both independently confirm a recurring defect: lower-body-focused shots (hero_garment = a bottom) sometimes render the model with no top at all, even though a top was part of the outfit. `hero_visibility_standard` above only guarantees visibility for the garment tagged `hero_garment`; nothing in the pre-v6 file required a **non-hero, co-worn** garment to still be rendered. `inner_layer_visibility` (below) came close but only covered the reverse case — a base tank/bra under a jacket HERO. This left a real, unaddressed gap for the far more common case: a bottom is the hero, a top is co-worn, and nothing explicitly says the top must stay on. `front_lower_crop`'s own angle definition covers "forehead to the floor" — the torso is always in frame at this angle, so this isn't a framing/cropping question; if the top disappears, it disappears from the render itself.

**Params:**

* **presence_guarantee (HARD CONSTRAINT — no exceptions):** every garment actually provided as part of the outfit selection must be rendered as worn, in every shot, regardless of which single garment is tagged `hero_garment` for that job. A bottom-hero shot still shows the co-worn top (sports bra, tank, tee), fully clothed — never bare torso, never exposed chest. A top-hero shot still shows the co-worn bottom. This holds on every angle (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`) — `front_lower_crop`'s "forehead to floor" coverage means the torso is always in frame and always needs a garment on it.
* **hero_emphasis_without_omission:** the hero garment gets the visual priority and detail treatment per `hero_visibility_standard` — this rule does not compete with that, it just guarantees the *other* garment isn't dropped entirely while the hero gets its emphasis.
* **residual_risk_note:** this closes the content-level gap that could plausibly cause the defect. If the actual root cause is upstream — the co-worn garment's asset simply never being provided to the generation job at all — no styling.md rule can fix that; it would need the asset-provisioning layer fixed directly. Both are worth checking against real generation logs; this rule is the fix for the content-level half of the risk.

***

## garment_length_reference_fidelity

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

* Roles: bag, accessory, headwear, jewelry
* Categories: bags, headwear, sunglasses, watches, earrings

**Accessories are NOT restricted to full-front/mood only, because BZT's own pose library builds entire poses around equipment appearing IN the crops (`sumo_squat_prop_hold_pose`, `resistance_band_chest_pull_pose`, `straight_arm_equipment_press_pose`, `bird_dog_kneeling_extension_pose`, etc.). Every accessory and every piece of training equipment (pilates ball, dumbbell, resistance band, racket, bag, bottle) is STRICTLY PROVISION-DRIVEN — styled only when actually part of the outfit selection / this angle's assets, never invented — and kept minimal: no over-accessorizing, no large fashion handbags, no stacked or heavy jewelry (per `minimal_accessories_authentic_styling`).**

**Params:**

* **adornment_scope (HARD CONSTRAINT, strengthened 2026-08-28):** worn adornment accessories (small hoop/stud earrings, cap/visor, sunglasses, watch) are styled on `full_front` (and `full_back` where visible) exactly as the reference shows; never invented if not provided — **and never silently dropped when it IS provided.** Direct evidence from generated output: a sunglasses asset was present in the provided item set for a job, but the generation prompt never mentioned it and the rendered image showed no sunglasses at all — the opposite failure from inventing an item, equally wrong. If an adornment accessory is a genuine, provided asset for this job, it must appear in the output; omitting a real provided item is exactly as much a defect as inventing one that wasn't provided. **Root-cause note:** this specific defect's evidence points to the prompt-assembly layer failing to carry a provided accessory into the prompt at all, not to a gap in this rule's wording (which already said "provision-driven" before this update) — this strengthening is defense-in-depth, not a confirmed fix; see `RCA_LOG.md`.
* **earring_note:** where an earring reference is provided, extract ONLY the jewellery itself — never the reference model's ear, face, hair, or any prop/hand it's photographed against — and place it on this shot's own model. Keep it small and minimal (studs/small hoops) — sports styling never stacks jewellery and never uses large/statement pieces.
* **equipment_scope (strengthened 2026-08-28):** hand-held training equipment (ball, dumbbell, band, racket) or a bag appears on whichever shot type the SELECTED pose entry's own Params place it on — this is governed by the pose library's item-completeness and equipment-carry-outranks-priority rules, not by shot type alone. **A pose entry describing a held item (a water bottle, a bag, a piece of training equipment) is only eligible to be selected as-written when that specific item is an actual provided asset for this job.** If no such item was provided, the selected entry must fall back to its own empty-handed/relaxed-hand alternative — never invent a plausible-sounding prop just because a pose entry's default Params describe holding one. Evidence: a generated prompt described "one hand holding a water bottle equipment piece" for a job whose provided item set contained no bottle or bag asset at all.
* **bag_scope:** a bag is styled on every shot where it's provided and the selected pose entry places it (carried by the handle, slung on one shoulder, or worn crossbody); never invented if no bag is provided.
* **footwear_note:** footwear is a worn garment, not an accessory — it follows the shot's own framing, unaffected by this rule.

***

## hero_based_tuck_state

**Label:** Hero-Based Waist Styling (shot-governed — AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, bottom, base_layer
* Categories: t-shirts, tank tops, sports bras, shirts, skirts, shorts, leggings, sweatpants, sweatshirts & hoodies

**The waist styling of an upper worn over a bottom is decided by the SHOT TYPE and the HERO garment's role, not by the upper's fit alone. `full_front` and `full_back` are REFERENCE-LED — reproduce exactly the tucked/untucked state the styled reference shows (`item_characteristics`'s `worn_state`). On `front_upper_crop` and `front_lower_crop`: if the HERO is an upper (tank/tee/shirt), it is worn OVER the waistband, hanging loose, its hem level on both sides; if the HERO is a bottom (shorts/leggings/skirt), the upper is worn fully INSIDE the waistband so the bottom's waistband and rise read cleanly — the upper is still worn, per `co_worn_garment_never_bare` above, just tucked in rather than left off.**

**Params:**

* **tuck_state:** SHOT- and HERO-governed; describe plainly as tucked-in or untucked-over — never a lopsided, one-sided, or half-in/half-out result (a HARD ERROR).
* **visibility_priority:** an upper worn inside the waistband reveals the hero bottom's waistband; an upper worn over the waistband reveals the hero upper's full hem and length.

***

## shirt_tuck_no_half

**Label:** Polos & Shirts — Full Tuck or Full Untuck ONLY, Never Half (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, top, base_layer
* Categories: shirts

**Params:**

* **tuck_state (exactly one of two clean states):** a collared/sleeveless polo or shirt is always either FULLY TUCKED (hem inside the waistband all the way around) or FULLY UNTUCKED (hem over the waistband, level all the way around). Never one side inside while the other hangs out — a HARD STYLING ERROR.

***

## closed_detail_presentation

**Label:** Closure Integrity for Detail and Crop Shots

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: jackets, sweatshirts & hoodies, vests

**Params:**

* **closure_state:** on `front_upper_crop` and `front_lower_crop` shots, any garment with a zip is worn fully closed unless the entry's own pose Params (e.g. an overhead reach or press pose) require the arm position that naturally leaves it open. On `full_front`/`full_back` the closure is REFERENCE-LED — open if the reference shows it open, closed if closed.
* **visibility_priority:** on a detail-focused crop, one key feature (zip pull, chest logo, waistband branding) stays unobstructed by hair or hands.

***

## inner_layer_visibility

**Label:** Base Tank/Bra Under a Zipped Hero Outer

**Priority:** 1

**Applies when:**

* Roles: hero_garment
* Categories: jackets, sweatshirts & hoodies, vests
* A base tank, tee, or sports bra is also part of the outfit

**Params:**

* **inner_closure_and_state:** on `full_front`/`full_back`, the outer's openness and the base layer's visibility are reproduced exactly from the reference — the base layer is always shown, never dropped to bare skin. On `front_upper_crop`/`front_lower_crop`, the outer is worn closed per `closed_detail_presentation` and the base layer is worn inside the bottom — no inner hem hangs out below the hero's hemline. **This is the jacket-hero instance of the general rule now stated in `co_worn_garment_never_bare` above** — kept as its own entry since it has additional closure-state detail specific to a zipped outer.

***

## sleeve_presence_and_treatment

**Label:** Sleeve-Presence Fidelity + Pose-Led Sleeve State

**Priority:** 3

**Applies when:**

* Roles: hero_garment, top, base_layer
* Categories: t-shirts, shirts, sweatshirts & hoodies

**A garment's sleeve LENGTH is a fixed product property and is never changed: sleeveless stays sleeveless, short stays short, long stays long — never add, extend, or invent a sleeve. The STATE of a genuine long sleeve (worn down vs. pushed up) is pose-led: on the still, level entries (`athletic_standard_frontal_stance`, `athleisure_full_body_neutral_stance`) sleeves stay worn DOWN by default; on a Tier-1/Tier-2 dynamic pose whose own Params imply active exertion (`straight_arm_equipment_press_pose`, `sprint_arm_drive_crop_pose`, `overhead_lateral_reach_stretch_pose`), a relaxed push-up/roll reflecting real motion is correct and should NOT be forced back down.**

**Params:**

* **sleeve_treatment:** reproduce true sleeve length from `item_characteristics`; state (down/pushed) follows the selected pose's own energy, never forced either way by default.
* **visibility_priority:** the true sleeve length and cuff construction stay identifiable regardless of state.

***

## bottom_never_tucked_into_footwear

**Label:** Bottoms Always Worn OVER Sneakers and Crew Socks — Never Tucked In (HARD RULE)

**Priority:** 1

**Applies when:**

* Roles: bottom, hero_garment, footwear
* Categories: sweatpants, leggings, tights, socks, shoes

**Params:**

* **hem_over_footwear (HARD CONSTRAINT — no exceptions):** a long bottom's leg — sweatpants, joggers, leggings, tights — always falls down and over the sneaker collar and any crew sock; it is never inserted, stuffed, or tucked into the sock or footwear shaft. This holds on every shot where the leg-to-footwear transition is visible (`full_front`, `full_back`, `front_lower_crop`).
* **sock_provision_gate (HARD CONSTRAINT — no exceptions, added 2026-08-29):** socks/hosiery of any kind are rendered ONLY when a distinct socks/hosiery item is an actual, provided asset for this job. If no such asset was supplied, the ankle/lower-leg shows bare skin or the shoe's own inner liner — never an invented crew sock, ankle sock, ribbed sock, or any other hosiery, regardless of what a shot-type or framing description otherwise implies. This overrides any general footwear-visibility language elsewhere (including angle/framing notes) that isn't itself conditioned on sock provision.
* **sock_height_ceiling (HARD CONSTRAINT — no exceptions, added 2026-08-29):** when a sock asset IS provided and visible, its height must stay strictly below the bottom garment's own hem line at all times — a sock riding up to reach, cover, or overlap the garment's fabric is a hard error, identical in severity to tucking the hem into the sock. The garment's hem is always the outer, visible boundary; the sock stays entirely below it.

***

## proportional_balance_wide_bottom

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

## proportional_balance_slim_bottom

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

## muted_palette_with_bright_accent

**Label:** Muted Base Palette with Bright Accent Colors Only (AUTHORITATIVE)

**Priority:** 1

**Applies when:**

* Roles: hero_garment, base_layer, outerwear, bottom, footwear, bag

**Params:**

* **color_blocking_role:** the outfit's BASE palette stays muted and tonal — the bright, saturated, or high-contrast color in a look is used ONLY as an accent (a trim, a color-blocked panel, a sole color, a headband) never as the dominant tone across multiple garments at once.
* **proportion_strategy:** where the garment reference itself is color-blocked or graphic (e.g. `color_blocked_polo_with_pleated_skirt`), that panel IS the permitted accent — it does not also need a second bright garment layered on top of it. Reproduce the reference's actual colors; never add extra bright pieces to "match the energy."
* **formality_signal:** keeps the overall look reading clean and functional rather than loud or costume-like — bright accents read as intentional, not as the whole story.

***

## minimal_accessories_authentic_styling

**Label:** Minimal Accessories, Authentic Presentation (No Overstyling)

**Priority:** 1

**Applies when:**

* Roles: accessory, bag, headwear, jewelry, watches

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

* **color_blocking_role:** where a non-neutral accent color is present, repeat it in at least one other element — e.g., a colour-blocked polo's trim matched to the pleated skirt band, or a sole colour matched to a chest stripe — so it reads as an intentional accent, not scattered color. This governs HOW the accent repeats; `muted_palette_with_bright_accent` governs how much of the look it's allowed to dominate.
* **proportion_strategy:** uses the repeated accent to guide the eye across the outfit's focal points (chest, waist, footwear) without turning the base palette loud.

***

## accessory_color_mirroring

**Label:** Accessory Color Coordination

**Priority:** 6

**Applies when:**

* Roles: bag, footwear, accessory
* Categories: bags, shoes, watches, headwear

**Params:**

* **accessory_emphasis:** where a bag, cap, or watch is provided, its color/material coordinates with the footwear or a chest/waistband accent rather than clashing.
* **texture_contrast:** avoid mixing mesh/technical fabric with leather within the same accessory group unless the reference shows it.

***

## metallic_hardware_consistency

**Label:** Unified Hardware Tone

**Priority:** 6

**Applies when:**

* Roles: accessory, bag, footwear, jewelry
* Categories: bags, shoes, watches, earrings

**Params:**

* **accessory_emphasis:** visible metallic/hardware elements (zip pulls, eyelets, watch case, bag hardware, earring metal) share the same tone where more than one is provided.
* **color_blocking_role:** gold and silver tones are not mixed within a single look unless the reference explicitly shows it.

***

## cropped_top_untucked_high_waist_bottom

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

## tucked_polo_with_mini_skirt

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
* **layering_position:** polo tucked into the skirt waistband
* **waist_definition:** clean waist definition at the skirt waistband
* **proportion_strategy:** fitted sleeveless top paired with a flared mini skirt
* **visibility_priority:** waistband and skirt pleats fully visible
* **accessory_emphasis:** minimal athletic accessories like visors and crew socks

***

## tucked_polo_with_athletic_shorts

**Label:** Tucked Polo Shirt With Satin Athletic Shorts

**Priority:** 3

**Applies when:**

* Roles: top, bottom
* Categories: shirts, t-shirts, shorts
* Fit: slim, relaxed
* Length: hip-length, short

**Params:**

* **tuck_state:** fully tucked into the waistband
* **layering_position:** polo tucked into the shorts waistband
* **waist_definition:** defined waist over athletic shorts
* **proportion_strategy:** tailored polo balanced with relaxed athletic shorts
* **visibility_priority:** shorts waistband and piping clearly visible
* **formality_signal:** polished sport-luxe

***

## athletic_sock_sneaker_layering

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

## track_jacket_untucked_over_skirt

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

## athletic_untucked_tee_over_shorts

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

## zipped_track_jacket_layering

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

## tucked_top_with_high_waist_bottom

**Label:** Tucked Top with High-Waisted Bottoms

**Priority:** 2

**Applies when:**

* Roles: top, bottom
* Categories: tops, t-shirts, sweatpants, shorts, leggings
* Fit: fitted, slim, regular
* Length: hip-length, cropped

**Params:**

* **tuck_state:** fully tucked into the waistband of high-rise bottoms
* **layering_position:** base top tucked inside the waistband
* **waist_definition:** accentuates the waistline and the clean separation between upper and lower garments
* **proportion_strategy:** streamlined silhouette emphasizing leg length and waist placement
* **visibility_priority:** waistband and tuck cleanliness must remain visible

***

## untucked_polo_over_track_pants

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

## cropped_tank_over_high_waist_bottoms

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

## zipped_jacket_over_tank_and_leggings

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
* **proportion_strategy:** cropped outerwear framing a fitted base layer
* **visibility_priority:** inner tank and high waistline visible beneath the open jacket

***

## color_blocked_polo_with_pleated_skirt

**Label:** Sleeveless Color-Blocked Polo With Pleated Athletic Skirt

**Priority:** 5

**Applies when:**

* Roles: top, bottom
* Categories: tops, skirts, shirts
* Fit: slim, fitted
* Length: hip-length, mini

**Params:**

* **tuck_state:** tucked into the waistband
* **waist_definition:** defined waist with a wide skirt band
* **proportion_strategy:** slim sleeveless top balanced with a flared mini skirt
* **silhouette_contribution:** classic athletic court silhouette
* **formality_signal:** preppy sport-luxe
