# Pose Library — v6

**v6 build notes:** This is the ground-truth-driven rebuild, synthesized from `v4_framework` (last confirmed-good baseline) plus `GROUND_TRUTH_FINDINGS.md` (113-slide deck), `GROUND_TRUTH_2_FINDINGS.md` (76-slide deck, 21 slides reviewed so far), and `RCA_LOG.md`. Every entry below carries a new **`Angles:`** field using the confirmed 5-value vocabulary (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`, `all`) — "mood_shot" is retired as a value everywhere in this file. Per Sunny's explicit guardrail: **every already-correct pose from v4 is preserved as-is** — only entries touching a confirmed ground-truth violation were changed. **New this pass:** per Sunny's 2026-08-27 direction, entries marked **CROSS-FILE ENRICHMENT** below are ported from the Female file's genuinely gender-neutral pose mechanics, addressing the previously observed Male/Female variation gap — each is clearly marked as ported (not sourced from this file's own 73-image reference set) so provenance stays honest for any future RCA trace.

**Global pose principles (apply to every rule below) — the BZT MALE SPORTS house look is CONTROLLED ATHLETIC ENERGY.** The male model reads as an athlete captured mid-action or in confident equipment-ready posture — NOT a static mannequin. The DEFAULT and correct register is **dynamic and purposeful**: real sport-grounded motion (sprint, lunge, hinge, curl, equipment carry, kneeling grip) demonstrating fabric behavior and gear interaction. This is audited, not asserted by analogy to the female pass: of the 73-image reference set, `Full front` (31 images) and `Full Back` (8 images) are the static-leaning batch — confirmed dominant pose there is the still, level, evenly-weighted stand — while `Upper crop` (26 images across six pose sets) and `Lower crop` (8 images) are built almost entirely around held dynamic action. Static, level stands remain valid as the fallback register, not the default.

**HARD REQUIREMENTS (mandatory for every variant, every shot — a violation is a hard error):**
1. **CONTROLLED ACTION, NEVER AN ACCIDENT — AND NEVER A WALKING GAIT.** A dynamic pose (sprint, lunge, hinge, kneeling grip) reads as deliberate and balanced, never a stumble or off-balance wobble. Static entries keep both feet planted flat and grounded. **A walking / mid-stride GAIT — one foot lifted and swinging as if caught between literal footsteps — is PROHIBITED COMPLETELY, on every shot type, with no exception.** Confirmed independently by both the client's original feedback and the ground truth deck ("Walking pose is not acceptable in front and back shot," "the model is abnormally walking... applicable for any angle"). Realistic athletic actions that are NOT a walking gait — jogging/running stride, lunging, stretching — remain in scope, governed by Hard Requirement 14 below.
2. **ASYMMETRY WHEN THE POSE CALLS FOR IT — NEVER FORCED BACK TO LEVEL.** Follow each entry's own alignment call: lean fully into a hinge, lunge, curl, or asymmetric shift when its Params specify one; render a level/even stance as clean and confident, never stiff or mannequin-like.
3. **THE HAND NEVER TOUCHES THE GARMENT, IN ANY SHOT, IN ANY ANGLE — NOT GRIPPING, NOT PINCHING, NOT BUNCHING, AND NOT SIMPLY RESTING ON IT EITHER.** Confirmed by Sunny as a hard guardrail, 2026-08-27: "hands cannot touch the garment in any shot... even if it is resting on the garment, it is not allowed." A hand may rest on **bare skin**, may hang free without touching the body, may hold a **pocket**, may grip **equipment** (a club, racket, dumbbell, ball, bag — not garment), or may clasp the other hand — but the moment it contacts fabric the model is wearing, including a thigh, hip, knee, or shin covered by shorts/leggings/joggers, it is a hard error. Equipment interaction is still functional, never fidgety, and matched to the garment's actual sport. **Note on an earlier, narrower reading:** one ground truth slide (113-slide deck, #9) implied hand-on-knee was acceptable specifically on a crop shot, not front/back — that per-angle nuance is superseded by this later, more sweeping instruction, given with full awareness of the earlier slide. This is a deliberate supersession by a more authoritative, more recent, explicit client ruling, not an unnoticed contradiction.
4. **EXPRESSION — ALIVE, ENGAGED, AND NATURAL, NEVER BLANK, LOST, OR EDITORIAL.** A present, quietly confident, relaxed athletic model, energy matched to the pose. Blank, vacant, or frozen is a hard error; vary it naturally across variants.
5. **HEAD & GAZE MATCH THE POSE'S OWN CALL, NEVER DEAD-LOCKED — AND THIS IS THE PRIMARY SOURCE OF VARIETY BETWEEN THE TWO VARIANTS ON A SHOT.** Follow each entry's own `head_orientation`/`gaze_direction`, and where an entry lists more than one option, the two generated variants for that shot must land on visibly different ones. Applies on EVERY shot type, `full_back` included: a flat, un-turned back-of-head on every variant is a confirmed client rejection. On `full_front`, alternate between a level direct-to-camera look and a naturally tilted/turned head. **UPDATED 2026-08-27 per the ground truth deck:** a downward/eyes-lowered gaze (vocabulary options 4 and 6 below) is eligible but is now a **discouraged, lower-preference option**, not an equal-weight default — two ground truth slides marked an otherwise-good shot "Acceptable, but the model should not look down."
6. **FRAMING FOLLOWS THE SHOT TYPE — AND HANDS ARE NEVER CLIPPED BY THE FRAME EDGE.** `full_front`, `full_back`, and `front_lower_crop` keep feet in frame; `front_upper_crop` is waist-up by definition. On every crop type, whenever a pose's own Params call for a raised, extended, or driven arm, the subject must be positioned with enough lateral margin that the hand stays completely inside the frame.
7. **EVERY LOADED ITEM MUST BE PLACED AND CARRIED — THIS OUTRANKS PRIORITY.** A club, racket, ball, bag, or bottle that's loaded needs an explicit placement in the selected entry's Params. An entry that leaves hands empty must not be picked over an eligible entry that carries the item, even at a lower Priority. **RESTORED 2026-08-29:** this enforcement sentence was silently dropped from this file during the v4→v6 rebuild (the Female file's equivalent rule kept it) — its absence removes the actual selection-time guardrail against an equipment-loaded job landing on an empty-handed pose, which matches the real-output "golf stick is missing" finding.
8. **`AVOID WHEN` / `CONFLICTS WITH` ARE BINDING; VARIANTS DIFFER BY POSE, NOT ITEM COUNT.** Neither is advisory — never override an `Avoid when` match for a Priority win, and never drop an item in one variant that another variant of the same shot shows. **RESTORED 2026-08-29** — same silent drop as Hard Requirement 7 above.
9. **NO EXAGGERATED OR PHYSICALLY IMPOSSIBLE POSES.** No backbends, exaggerated arches, or unrealistic movement without a QC sign-off flag.
10. **FOOTWEAR MATCHES THE ACTIVITY.** Barefoot is a confirmed rejection, independently reconfirmed by the ground truth deck — never an arbitrary or mismatched shoe, never barefoot.
11. **NATURAL HAIR, NEVER RESTYLED; NO OVERSTYLING.** Keep the model's reference hairstyle exactly as shown. No glamorous posing, no theatrical flourish.
12. **HANDS-IN-POCKET IS AN ELIGIBLE FALLBACK, NOT A DEFAULT — AND HANDS ARE NEVER ON THE HIP/WAIST, IN ANY ANGLE.** The ground truth deck rejects hand-on-hip/waist placement ~30 times, in every angle, with no exception. By elimination, pocket is an eligible fallback gesture drawn from a **shared, rotating fallback-gesture pool** (pocket, relaxed-at-sides, equipment-carry) — never the first-listed or most-frequent choice on its own, never identical across both variants of a shot.
13. **`athletic_akimbo_power_pose` IS RETIRED.** Its entire premise was hands-on-hips; no non-hip alternate exists, so it's retired outright rather than patched.
14. **RUNNING IS ELIGIBLE ON CROP SHOTS ONLY, NEVER ON `full_front`/`full_back` — AND ONLY THE DIAGONAL/SIDEWAYS MECHANIC, NEVER FORWARD-FACING.** The ground truth deck confirms forward-facing running is rejected "in any angle," but a side/diagonal running mechanic is explicitly accepted on crop shots. NEVER a "flying" pose.
15. **`full_back` NEVER CARRIES A WIDE-STANCE, HIGH-MOVEMENT DYNAMIC POSE.** The ground truth deck rejects this pattern 10 times explicitly. No Male-file entry currently combines `full_back` with a wide-stance Params block, so this doesn't put any existing entry in conflict. `full_front` has **no equivalent evidenced restriction** — direct ground truth evidence (full-body, front-facing dynamic poses explicitly marked "the movement is good to go") confirms movement is acceptable there; `full_front`'s lean toward static entries is a soft default, not a hard ban.
16. **THE HERO GARMENT MUST NEVER BE STRUCTURALLY CROPPED OUT OF FRAME — `front_upper_crop` AND `front_lower_crop` ARE NOT INTERCHANGEABLE FOR A BOTTOM-CATEGORY HERO GARMENT.** Added 2026-08-27, per Sunny's direct instruction and the two angle-definition files' own text. `BZT_FRONT_UPPER_CROP_SPORTS.md`'s own coverage note: "Lower garments are cropped to show the waistband, rise, and upper thigh area" — correct and expected when a TOP is the hero garment and the bottom (shorts, joggers, sweatpants) is secondary/styling context, but this framing **cannot** show a bottom garment's hem, inseam, or full leg line. `BZT_FRONT_LOWER__CROP_SPORTS.md` is the angle that guarantees this: "The entire length of the garment is captured, including hemlines, side seams, and specialized cuffs or inner linings." **Rule: whenever the hero garment for a given job is a bottom-category item, that job must never be routed to a pose whose only eligible angle is `front_upper_crop`** — either select an entry that also lists `front_lower_crop` (or `full_front`/`full_back`) among its `Angles`, or if the desired pose's mechanic is `front_upper_crop`-only, do not use it for a bottom-hero job. The reverse applies symmetrically for a top-category hero garment on a `front_lower_crop`-only entry. This is a selection-time check, not a per-entry rewrite — the wide-stance/squat entries most likely to carry a bottom-category hero garment have been given a `front_lower_crop` companion angle in this v6 pass; entries whose stance genuinely doesn't translate to a lower-crop framing (an overhead flex, a seated curl, a golf address hinge) were left `front_upper_crop`-only on the assumption their hero garment is normally a top, not a bottom.
17. **EVERY POSE MUST READ AS ONE SINGLE, COHERENT, NATURAL HUMAN ACTION — NEVER AN AWKWARD OR UNRELATED COMBINATION OF GESTURES.** Added 2026-08-28, generalizing a pattern that was previously only patched entry-by-entry. Ground truth confirms this as a real, standing rejection reason distinct from any specific mechanism like hand placement or clothing type: *"The movement does not look natural for any angle"* (`Ground Truth BZT Sports.pptx`) and *"the pose is weird, the model is abnormally walking"* (same deck). This file already carries several entry-specific instances of this same failure mode from earlier RCA work — a raised or clenched fist during a lunge counterbalance reading as an unrelated boxing-guard gesture rather than a natural stabilizing hand; a hand tucked behind the lower back during a torso-twist reading as a borrowed, unrelated gesture rather than a natural counter-arm. **Those were real generated outputs, flagged and fixed individually — this requirement generalizes the underlying principle so it isn't limited to the specific instances already caught.** Test: does the full combination of stance, arm/hand position, torso angle, and head/gaze read as ONE thing a real athlete would actually do in that moment — not as body parts individually valid but assembled from unrelated poses. A pose can satisfy every other Hard Requirement in this file (achievable, not exaggerated, no garment contact, no hip contact) and still fail this one if the overall gesture reads as disjointed or borrowed. This is necessarily a qualitative, not a quantifiable, standard — there is no numeric threshold for "natural" — but it is a hard requirement, not a suggestion: an entry whose Params combination doesn't hold together as one coherent action needs its Params rewritten, not shipped as-is on a technicality.

**Equipment & prop vocabulary (from the BZT reference set).** In rough order of frequency: **(1)** both hands clasped low, as if gripping a club (golf address hinge); **(2)** one hand held open, hovering near the thigh WITHOUT touching it, during a lunge or stretch — CORRECTED 2026-08-27, no longer "resting"; **(3)** one hand raised, resting a racket/club on the shoulder (equipment, not garment); **(4)** both hands clasped behind the head (overhead flex); **(5)** forearms crossed at the chest, held clear of the garment (guard stance); **(6)** both hands kneeling, gripping equipment near the ground; **(7)** one arm securing a ball at the hip, chest, or behind the back — the ball, not the hand, contacts the body, which is fine; **(8)** one hand carrying a bag; **(9)** one hand curling a dumbbell. Items "(2) hand on hip/thigh" and "hands on hips, akimbo" from the pre-v6 vocabulary are retired — hip and thigh contact are both banned outright, hovering only, per Hard Requirement 3.

**Head-movement vocabulary (from the BZT reference set, confirmed gender-agnostic).** On front-facing shots, draw from: **(1)** direct-level frontal; **(2)** level side-glance; **(3)** turned and tilted down together; **(4)** chin dropped, eyes lowered — DISCOURAGED, lower preference; **(5)** profile with chin slightly lifted; **(6)** level and forward, only the gaze cast downward — DISCOURAGED, lower preference. On rear-facing shots: **(1)** flat back-of-head — fallback only; **(2)** near-profile turn, ear visible — primary recommended; **(3)** turned and tilted down, tracking equipment or the ground.

**Shot-type behavior.** `front_upper_crop` and `front_lower_crop` carry the dynamic register — nearly every action pose was sourced from these crops, and the ground truth deck's own "Do's" slide confirms crop shots need movement. `full_front`/`full_back` are dominated by the still, level stand and carry the neutral/silhouette entries as their primary register, with select dynamic entries usable as secondary full-body variants. `full_back` never carries a wide-stance, high-movement dynamic pose (Hard Requirement 15) — this file has no such conflict currently. **Reinforced 2026-08-28 after reviewing real output:** "secondary" means selected occasionally, not as the default landing spot — wide-stance entries (`wide_skater_lunge_hands_clasped_pose`, `wide_lateral_side_lunge_pose`) being eligible on `full_front` is not license to select one every time a dynamic variant is wanted; the static/narrow-stance entries remain the primary register and should be the majority outcome. If selection frequency data ever shows wide-stance entries dominating `full_front` output, that is the same class of problem as the hip-saturation issue in RCA Log Entry 2 — a frequency defect, not a content one, and needs a selection-layer fix, not a file edit.

**Inter-SKU and inter-variant pose variety.** Every angle now carries several eligible pose entries at neighboring Priority values specifically so different SKUs sharing the same angle, and the two variants generated for one shot, don't converge on one repeated pose.

---

## dynamic_sprint_stride_pose
**Label:** Dynamic Full-Sprint Mid-Stride Drive

**Priority:** 1

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, shorts, leggings, vests
- Fit: skin-tight, slim, fitted, athletic-fit
**Avoid when:**
- Categories: trousers, suits, blazers & coats, jackets
- Bottom category: sweatpants, joggers, cargo pants with Fit: relaxed (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; added 2026-08-28 during output validation — a full-sprint drive doesn't suit a loose/relaxed bottom any more than a wide lunge does, and this entry had never received the same exclusion sweep as the lunge entries in RCA Log Entry 4)

**Conflicts with:** static_full_body_pose, athleisure_frontal_standing_pose, rear_view_silhouette_pose

**CLIENT-APPROVED REFERENCE — the sole approved running-stride mechanic. Per Hard Requirement 14:** eligible on `front_upper_crop`/`front_lower_crop` only, never `full_front`/`full_back`. Only the diagonal/sideways mechanic is acceptable, never forward-facing. `hydration_vest_dynamic_stride_pose` was removed — its entire premise was a rear-view `full_back` stride, prohibited twice over.

**Params:**
- **stance:** full mid-stride sprint drive, grounded and controlled — NEVER an airborne leap. Lead leg driven forward and up with a sharp high-knee lift, trail leg extended back and bent, the trailing foot's toe/ball still in contact with or just leaving the ground
- **arm_position:** reciprocal arm drive — one arm bent and driven up toward chest height, hand relaxed with fingers loosely spread, never a clenched fist; the other arm bent and driven back down, hand equally relaxed, never resting on or touching the hip/garment (Hard Requirement 3)
- **torso_angle:** three-quarter turn at roughly 45 degrees, moving diagonally toward the camera or sideways across the frame — never angled or moving away from the camera
- **head_orientation:** turned to a three-quarter angle away from direct camera contact, chin level, focused, always fully visible in frame — vary the exact degree/side across the two generated variants
- **gaze_direction:** directed off to the side into the distance — not down at the ground, not straight at the lens — focused, high intensity
- **weight_distribution:** dynamic, loaded onto the driving leg, always grounded
- **recommended_framing:** front_upper_crop or front_lower_crop — top of head to roughly mid-thigh, face always fully in frame. Never `full_front` or `full_back`
- **footwear:** when feet are in frame, the model always wears proper running shoes — never barefoot
- **garment_visibility_priority:** shows fabric stretch, drape and moisture-wicking behavior under real motion
- **movement_suggestion:** peak-action capture, a real grounded stride — never a jump, leap, or airborne moment

---

## dynamic_lunge_stretch_pose
**Label:** Dynamic Forward Lunge & Hamstring Stretch

**Priority:** 2

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sweatshirts & hoodies, jackets, shorts, sweatpants, t-shirts, leggings
- Fit: slim, regular, relaxed
- Length: above-knee, hip-length, full-length
**Avoid when:**
- Categories: dresses, skirts, suits
- Bottom category: sweatpants, joggers, relaxed trousers with Fit: relaxed (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment like a hoodie matches; a deep wide lunge doesn't suit a loose/relaxed bottom regardless of what the top is — see RCA Log Entry 4)
**Requires:** static_full_body_pose

**Conflicts with:** rear_view_silhouette_pose

**Params:**
- **stance:** deep forward lunge, wide stance, front leg bent and weight-loaded, back leg extended straight
- **hand_placement:** SECOND UPDATE 2026-08-27 — the original "hand resting on the hip or thigh" no longer complies with the stricter Hard Requirement 3. Corrected: one hand held open at hip height, WITHOUT touching the hip or thigh, fingers splayed; other hand hangs free or grips a prop (equipment)
- **torso_angle:** three-quarter turn, leaning forward significantly over the front leg
- **head_orientation:** turned to the side and tilted downward — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side or intently downward
- **weight_distribution:** heavily loaded onto the forward leg
- **recommended_framing:** front_upper_crop (torso-to-thigh) for the hand/torso lean detail; front_lower_crop for leg-line and short/legging length and drape
- **occlusion_avoidance:** arms and torso positioned to keep the garment's front seams and hem line visible during the stretch
- **movement_suggestion:** mid-stretch, functional and athletic, not posed-static

---

## weighted_equipment_curl_pose
**Label:** Weighted Training Curl, Forward Lean

**Priority:** 3

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, tank tops, sweatshirts & hoodies
- Fit: slim, regular, relaxed, oversized
**Avoid when:**
- Categories: trousers, jackets, dresses, skirts

**Params:**
- **stance:** standing, torso hinged forward at an angle, weight braced through the front foot
- **hand_placement:** one hand gripping a dumbbell (equipment) mid-curl near hip/thigh height — the dumbbell, not the hand, is near the body; other arm relaxed at the side, not touching it
- **arm_position:** working arm flexed and visibly loaded, forearm and bicep engaged
- **torso_angle:** forward-leaning three-quarter turn
- **head_orientation:** turned toward the working side, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** intense, directed off-camera toward the point of exertion
- **accessory_detail:** headband/wristband commonly present to reinforce training context
- **recommended_framing:** front_upper_crop, tight enough to show muscle definition and fabric strain across the shoulder/sleeve
- **garment_visibility_priority:** emphasizes shoulder mobility, armhole clearance, and fabric recovery under load

---

## golf_address_hinge_pose
**Label:** Golf Address Hinge, Hands Clasped Low

**Priority:** 4

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, accessory
- Categories: tops, shirts, polos, trousers, shorts
- Fit: tailored, regular, slim
- Length: full-length

**Params:**
- **stance:** feet shoulder-width apart, subtle forward hinge/lean from the hips as if addressing a ball
- **hand_placement:** both hands held low and together in front of the body, as if gripping a club or golf glove — hands touch each other/equipment, not garment
- **torso_angle:** facing forward but leaning down and forward from the waist
- **head_orientation:** turned to the side and tilted downward toward the implied ball position — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted downward, away from the camera
- **hip_angle:** hinged at the waist, hips shifted back
- **accessory_detail:** cap/visor commonly worn, brim visible in profile
- **recommended_framing:** front_upper_crop, chest-to-hip, to keep the hand-clasp and collar/placket detail legible
- **garment_visibility_priority:** showcases collar drape, placket construction, and pocket utility in a functional address stance

---

## crossed_forearm_guard_pose
**Label:** Crossed-Forearm Guard Stance

**Priority:** 5

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, accessory, glove
- Categories: t-shirts, tops, sweatshirts & hoodies, gloves
- Fit: regular, relaxed, oversized

**Params:**
- **stance:** standing upright, feet grounded, torso squared to slightly turned
- **hand_placement:** forearms crossed at the wrists in front of the chest, held clear of the chest garment, one hand resting over the other
- **torso_angle:** three-quarter turn
- **head_orientation:** turned to the side, chin slightly lifted, alert expression — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side, focused off-camera
- **accessory_detail:** gloves or wrist accessories held prominently at the crossing point
- **recommended_framing:** front_upper_crop, chest-to-waist, to keep the crossed-arm accessory interaction the focal point
- **garment_visibility_priority:** keeps chest graphics and sleeve hem clear while the accessory (gloves) becomes the focal interaction

---

## overhead_arms_flex_pose
**Label:** Overhead Arms Flex, Elbows Out

**Priority:** 6

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: tank tops, t-shirts, sweatshirts & hoodies
- Fit: relaxed, oversized, regular

**Params:**
- **stance:** standing straight, core braced
- **hand_placement:** both hands raised and clasped or resting behind the head (hair, not garment), elbows driven out wide
- **torso_angle:** frontal, chest open
- **head_orientation:** centered, chin level or slightly lifted
- **gaze_direction:** direct at camera or slightly averted
- **accessory_detail:** headband/bandana/sleeves commonly present, reinforcing training energy
- **recommended_framing:** front_upper_crop, chest-to-waist, to let the raised-elbow silhouette read clearly
- **garment_visibility_priority:** stretches the torso panel and underarm/side-seam construction into full view

---

## shoulder_rested_equipment_carry_pose
**Label:** Shoulder-Rested Equipment Carry (Racket/Club)

**Priority:** 7

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, accessory
- Categories: polos, t-shirts, tops, sweatshirts & hoodies
- Fit: regular, slim, relaxed

**Params:**
- **stance:** standing, weight even or slightly shifted
- **hand_placement:** one hand raised, gripping the handle/grip of a racket or club (equipment) that rests across the shoulder; other arm relaxed at the side or bracing the shaft, not touching the garment
- **arm_position:** raised arm bent at the elbow to support the equipment
- **torso_angle:** profile to three-quarter turn
- **head_orientation:** turned down and toward the resting equipment, or turned to profile
- **gaze_direction:** averted downward or to the side
- **occlusion_avoidance:** equipment held to the side/back of the shoulder line so it doesn't block chest logos
- **recommended_framing:** front_upper_crop, chest-to-waist
- **garment_visibility_priority:** highlights shoulder seam, collar structure, and sleeve opening as the equipment rests against them

---

## kneeling_equipment_grip_pose
**Label:** Kneeling Equipment Grip Close-Up

**Priority:** 8

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, set_piece, accessory
- Categories: tops, shorts, trousers, shoes, gloves

**Params:**
- **stance:** one knee lowered toward the ground, weight settled into a kneeling position
- **hand_placement:** both hands actively gripping a piece of equipment (club shaft, racket handle) close to the ground/lower body
- **torso_angle:** leaning forward and down toward the hands
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **framing_intent:** intentionally tight/close crop on the hands-and-equipment interaction rather than the face
- **recommended_framing:** front_lower_crop — knee-to-shoe, hands prominent in frame
- **garment_visibility_priority:** unique view of short/trouser drape at the knee, sock compression, and shoe construction from a low, grounded angle
- **pose_energy:** focused, tense, suggesting readiness or mid-preparation

---

## athletic_prop_carry_pose
**Label:** Athletic Prop Carry — Hip, Chest, or Rear Hold

**Priority:** 9

**Angles:** front_upper_crop, full_back

**Applies when:**
- Roles: hero_garment, accessory
- Categories: tops, shorts, bags

**Params:**
- **hand_placement:** variant A — one arm bent at the elbow securing a ball against the hip (the ball, not the hand, contacts the body — fine per Hard Requirement 3); variant B — ball held at chest height with the opposite hand relaxed, not touching garment; variant C (rear view) — one hand holding a ball behind the back, not touching garment
- **torso_angle:** three-quarter turn toward the side holding the prop, or squared-away for the rear variant
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **weight_distribution:** static, centered balance
- **arm_position:** the carrying arm creates a triangular negative space between torso and elbow
- **recommended_framing:** front_upper_crop for hip/chest holds; full_back for the behind-the-back variant
- **garment_visibility_priority:** ensures the prop does not fully occlude chest logos, team crests, or back branding

---

## athletic_equipment_ready_stance
**Label:** Athletic Equipment Ready Stance

**Priority:** 10

**Angles:** full_front

**Applies when:**
- Roles: top, bottom, accessory
- Categories: shirts, shorts, trousers
- Fit: regular, relaxed
**Avoid when:**
- Categories: jackets, outerwear

**Params:**
- **stance:** wide athletic stance, knees slightly bent (crouch) or feet stepped slightly apart
- **hand_placement:** one or both hands gripping equipment (racket handle, golf club, or water bottle) — not garment
- **torso_angle:** slight three-quarter turn
- **head_orientation:** focused toward the equipment or the implied direction of play — vary the exact degree/side across the two generated variants
- **weight_distribution:** low center of gravity, weight shifted slightly forward toward the lead leg
- **movement_suggestion:** static but tense, suggesting immediate readiness for motion

---

## athletic_akimbo_power_pose — RETIRED 2026-08-27, DO NOT SELECT
**Label:** Athletic Akimbo Power Pose

**Angles:** none — retired

**RETIRED — not eligible for selection.** This entry's entire premise is hands-on-hips (akimbo), which the ground truth deck rejects ~30 times, in every angle, with no exception — see Hard Requirement 3. Unlike other implicated fallback-tier entries, this one has no non-hip alternate, so it is retired outright. Left in the file for record/history only.

**Params (historical, non-functional):**
- **stance:** straight standing position, legs slightly apart
- **hand_placement:** hands placed firmly on hips (akimbo) — the specific placement now banned
- **shoulder_alignment:** squared and pulled back for an upright, powerful posture
- **torso_angle:** three-quarter turn or frontal
- **head_orientation:** draws from the Head-movement vocabulary
- **weight_distribution:** balanced evenly or with a subtle shift to one hip
- **garment_visibility_priority:** emphasizes the waistline transition, sleeve/armhole clearance, and chest crest placement

---

## tactile_accessory_engagement
**Label:** Tactile Accessory Engagement Pose

**Priority:** 12

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: bag, accessory, watches, headwear, glove
- Categories: bags, watches, socks, headwear, sunglasses

**Params:**
- **hand_placement:** one hand actively touching/holding the accessory (not the garment) — gripping a bag's carry strap at the side, adjusting a cap brim, or holding a duffel bag by its handles
- **arm_position:** leading arm raised or extended to create a dynamic diagonal line, negative space between arm and torso
- **torso_angle:** three-quarter turn to highlight the accessory's placement
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **shoulder_alignment:** asymmetric — the engaged-side shoulder typically raised or rolled forward
- **recommended_framing:** front_lower_crop for a hand-carried bag, front_upper_crop for cap/watch adjustment
- **occlusion_avoidance:** accessory held to the side of the body line so it doesn't obscure hero-garment logos

---

## football_kneeling_ball_dribble_pose
**Label:** Kneeling Football Ball-Dribble Crouch

**Priority:** 13

**Angles:** full_front, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, shirts, shorts, socks

**Params:**
- **stance:** low crouch, one knee bent low toward the ground, weight forward over a football resting under one foot
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one hand hovering open beside the raised knee WITHOUT touching it, other hand relaxed or braced on the ground (not garment) for balance
- **torso_angle:** three-quarter turn, leaning forward and down toward the ball
- **head_orientation:** angled down toward the ball, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, absorbed in the ball
- **weight_distribution:** low, forward over the grounded foot and the ball
- **recommended_framing:** full_front or front_lower_crop — the foot-on-ball detail needs the lower body in frame
- **garment_visibility_priority:** shows kit crest, sock height, and short length in a genuine match-ready stance

---

## racket_behind_head_hold_pose
**Label:** Racket Held Behind the Head/Neck, Close Crop

**Priority:** 13

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, accessory
- Categories: polos, t-shirts, tops

**Params:**
- **stance:** standing, weight settled, torso squared to slightly turned
- **hand_placement:** both hands raised, gripping the racket (equipment) handle and throat, resting the racket horizontally across the back of the neck/shoulders — the racket, not the bare hands, contacts the shoulders
- **torso_angle:** three-quarter turn, chest open
- **head_orientation:** level or turned slightly to one side beneath the raised arms
- **gaze_direction:** direct at camera or averted to the side, focused
- **recommended_framing:** front_upper_crop, chest-to-waist, so the raised-arm racket silhouette reads clearly
- **garment_visibility_priority:** stretches the torso and underarm construction into view, matching the raised-arm hold

---

## backpack_strap_adjust_profile_pose
**Label:** Profile Stance Adjusting Backpack Strap

**Priority:** 14

**Angles:** full_front, front_upper_crop

**Applies when:**
- Roles: hero_garment, top, outerwear, bag
- Categories: t-shirts, sweatshirts & hoodies, jackets, bags

**Params:**
- **stance:** standing profile, weight settled, torso turned to the side
- **hand_placement:** one hand raised, gripping or adjusting the backpack strap (equipment) at the shoulder; other arm relaxed at the side, not touching the garment
- **torso_angle:** profile to three-quarter turn
- **head_orientation:** turned back toward the camera over the strap-side shoulder — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct at camera or averted, alert
- **recommended_framing:** full_front or front_upper_crop — the strap-adjust gesture reads at either scale
- **garment_visibility_priority:** keeps the bag strap and shoulder seam legible without covering chest branding

---

## wide_skater_lunge_hands_clasped_pose
**Label:** Wide Skater Lunge, Hands Clasped Low

**Priority:** 13

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, sweatshirts & hoodies, shorts, sweatpants
- Fit: fitted, slim, relaxed
**Avoid when:**
- Categories: dresses, suits, blazers & coats
- Bottom category: sweatpants, joggers with Fit: relaxed (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; a wide lateral lunge/skater stance doesn't suit a loose/relaxed bottom — see RCA Log Entry 4)

**Params:**
- **stance:** wide lateral lunge/skater stance, one leg bent and loaded, the other extended to the side, torso leaning forward over the loaded leg
- **hand_placement:** both hands clasped together low in front of the body, elbows bent — hands touch each other, not garment
- **torso_angle:** three-quarter turn, leaning forward into the lunge
- **head_orientation:** turned toward the working side, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side or downward, engaged
- **weight_distribution:** heavily loaded onto the bent leg
- **recommended_framing:** full_front — the wide lateral stance needs the whole body in frame. Confirmed eligible per Hard Requirement 15
- **garment_visibility_priority:** shows leg-line stretch and waistband behavior under the lateral load

---

## forward_bend_hands_open_stretch_pose — RENAMED 2026-08-27, hands no longer braced on the knees
**Label:** Forward Bend, Hands Open (formerly "Braced on Knees" — name retained for history)

**Priority:** 13

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, tank tops, sweatshirts & hoodies
- Fit: fitted, relaxed, regular

**Params:**
- **stance:** standing, knees softly bent, torso hinged forward at the waist
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — both hands hovering open just above the knees, elbows out, WITHOUT touching the legs
- **torso_angle:** deep forward hinge, profile to three-quarter
- **head_orientation:** down, following the line of the fold — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, absorbed in the stretch
- **weight_distribution:** even, grounded through both feet
- **recommended_framing:** front_upper_crop, chest-to-thigh — the hands-near-knees hinge is the focal action
- **garment_visibility_priority:** shows shoulder/back panel stretch and chest graphic under the forward fold

---

## backpack_carry_rear_three_quarter_pose
**Label:** Backpack Carry, Rear Three-Quarter View

**Priority:** 14

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top, outerwear, bag
- Categories: t-shirts, sweatshirts & hoodies, jackets, bags

**Params:**
- **stance:** standing, weight settled, torso turned three-quarter away from camera
- **hand_placement:** one hand hooked under the backpack strap (equipment) at the shoulder; other arm relaxed at the side, not touching garment
- **torso_angle:** three-quarter rear turn, back predominantly visible
- **head_orientation:** turned to a near-profile over the strap-side shoulder — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side, alert
- **weight_distribution:** even, grounded
- **recommended_framing:** full_back — the strap-and-back-panel story needs the whole back in frame
- **garment_visibility_priority:** back yoke and bag-strap crossing read clearly without covering back branding

---

## bent_over_shoe_sock_adjust_pose
**Label:** Bent-Over Shoe/Sock Adjustment

**Priority:** 14

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom, footwear
- Categories: shorts, sweatpants, trousers, socks, shoes

**Params:**
- **stance:** standing on one leg, torso bent forward, opposite foot lifted and brought toward the hands
- **hand_placement:** both hands reaching down to adjust the sock/shoe (footwear, treated as equipment/gripping rather than garment contact) at the lifted foot
- **torso_angle:** forward-folded, three-quarter turn
- **head_orientation:** down, following the hands — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, focused on the adjustment
- **weight_distribution:** balanced on the standing leg
- **recommended_framing:** front_lower_crop, hip-to-shoe — the whole gesture lives at leg height
- **garment_visibility_priority:** shows the short/trouser hem break and sock height during the adjustment

---

## football_ball_hip_carry_pose
**Label:** Football Kit — Ball Secured at the Hip

**Priority:** 13

**Angles:** full_front, front_upper_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, shirts
- Pattern: team crest, graphic print, stripes, colorblock
**Avoid when:**
- Categories: polos, trousers, blazers & coats

**Params:**
- **stance:** standing, weight settled, three-quarter turn toward the side holding the ball
- **hand_placement:** one arm bent at the elbow, securing a football (equipment) against the hip — the ball, not the hand, contacts the body; other arm relaxed at the side, not touching garment
- **torso_angle:** three-quarter turn
- **head_orientation:** turned toward camera or angled downfield, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct at camera or averted toward the implied pitch
- **recommended_framing:** full_front or front_upper_crop
- **garment_visibility_priority:** chest crest and sponsor branding stay fully visible past the carrying arm

---

## tennis_forward_ready_stance_pose
**Label:** Tennis Forward-Bent Ready Stance

**Priority:** 13

**Angles:** front_upper_crop, full_front

**Applies when:**
- Roles: hero_garment, top
- Categories: polos, shirts
- Fit: fitted, slim

**Params:**
- **stance:** forward-bent ready stance, knees bent, weight low, feet staggered
- **hand_placement:** both hands held low in front of the body as if gripping a racket in the ready position
- **torso_angle:** three-quarter, leaning forward
- **head_orientation:** level, focused forward — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct forward, high alertness
- **recommended_framing:** front_upper_crop or full_front
- **garment_visibility_priority:** collar and placket detail stay legible through the forward lean

---

## tennis_vertical_racket_static_pose
**Label:** Tennis — Racket Held Vertically, Static Stand

**Priority:** 14

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, accessory
- Categories: polos, shirts, shorts

**Params:**
- **stance:** standing straight, weight even
- **hand_placement:** one hand holding a racket (equipment) vertically at the side, the head of the racket pointing up; other arm relaxed, not touching garment
- **torso_angle:** facing camera or slight three-quarter turn
- **head_orientation:** level, direct — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct at camera, composed
- **recommended_framing:** full_front
- **garment_visibility_priority:** full silhouette reads clearly, the racket a secondary vertical line that never crosses the placket

---

## golf_club_shoulder_static_profile_pose
**Label:** Golf — Club Resting on the Shoulder, Static Profile

**Priority:** 13

**Angles:** full_front, front_upper_crop

**Applies when:**
- Roles: hero_garment, top, accessory
- Categories: polos, trousers, shorts
**Avoid when:**
- Categories: sweatpants, sweatshirts & hoodies, tank tops

**Params:**
- **stance:** standing profile, weight settled and grounded — a held stance, never a mid-step or walking gait
- **hand_placement:** one hand raised, gripping a golf club (equipment) that rests across the shoulder; other arm relaxed at the side, not touching garment
- **torso_angle:** profile to three-quarter turn
- **head_orientation:** level, or turned toward the camera
- **gaze_direction:** averted downrange or direct at camera
- **recommended_framing:** full_front or front_upper_crop
- **garment_visibility_priority:** trouser break at the ankle and polo collar both stay legible

---

## golf_ready_focused_stance_pose — RENAMED 2026-08-27, hand no longer on the hip
**Label:** Golf — Focused Downrange, Hand Open at the Side (formerly "Hand on Hip" — name retained for history)

**Priority:** 14

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top
- Categories: polos, trousers, shorts

**Params:**
- **stance:** standing straight, weight even
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one hand open at the side, NOT resting on the hip; other hand holding a golf glove (equipment) or resting near a club at the side
- **torso_angle:** three-quarter turn
- **head_orientation:** turned to the side, gaze directed off toward the implied fairway — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side, focused
- **recommended_framing:** full_front
- **garment_visibility_priority:** waistband and polo tuck fully visible

---

## zip_hoodie_hands_clasped_profile_pose
**Label:** Zip Hoodie — Hands Clasped Low, Profile, Head Down

**Priority:** 15

**Angles:** front_upper_crop, full_front

**Applies when:**
- Roles: hero_garment, top, outerwear
- Categories: sweatshirts & hoodies
- Closure: zip

**Params:**
- **stance:** standing, weight settled, profile to three-quarter turn
- **hand_placement:** both hands clasped together low in front of the body — hands touch each other, not garment
- **torso_angle:** profile to three-quarter turn
- **head_orientation:** tilted down, following the line of the clasped hands — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, calm and unposed
- **recommended_framing:** front_upper_crop or full_front
- **garment_visibility_priority:** zip pull, drawstring, and hood construction stay legible in the profile turn

---

## front_zip_jacket_forward_lean_pose
**Label:** Front-Zip Jacket — Hands Clasped Low, Forward Lean

**Priority:** 15

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, outerwear
- Categories: jackets, sweatshirts & hoodies
- Closure: zip

**Params:**
- **stance:** standing, torso hinged forward at a shallow angle
- **hand_placement:** both hands clasped together low in front of the body
- **torso_angle:** three-quarter turn, leaning forward
- **head_orientation:** tilted down, following the line of the clasped hands — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, focused
- **recommended_framing:** front_upper_crop
- **garment_visibility_priority:** zip line and collar construction stay legible through the forward lean

---

## plank_position_floor_pose
**Label:** Plank Position, One Arm Braced, Body Diagonal

**Priority:** 15

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom
- Categories: shorts, t-shirts, tank tops

**Params:**
- **stance:** plank position, body forming a straight diagonal line from head to heel, supported on one braced forearm/hand and both feet
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one arm braced flat on the floor/mat (not garment) bearing weight; other hand extended forward, open, not resting on the hip
- **torso_angle:** three-quarter, diagonal toward the camera
- **head_orientation:** turned to the side, chin roughly level with the shoulder — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side, focused
- **recommended_framing:** front_lower_crop, hip-to-foot — the diagonal leg line and short length are the focal detail
- **garment_visibility_priority:** shows the short's rise and leg-line stretch under the plank extension

---

## wide_lateral_side_lunge_pose
**Label:** Wide Lateral Side Lunge, Hand Open

**Priority:** 16

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, shorts, sweatpants
- Fit: fitted, slim, relaxed
**Avoid when:**
- Categories: trousers, jackets, suits, blazers & coats
- Bottom category: sweatpants with Fit: relaxed (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; a wide lateral lunge doesn't suit a loose/relaxed bottom — see RCA Log Entry 4)

**Conflicts with:** static_full_body_pose, wide_skater_lunge_hands_clasped_pose

**Params:**
- **stance:** wide side-to-side lateral lunge, one leg bent and loaded directly to the side, the other extended straight, both feet flat and turned outward
- **hand_placement:** SECOND UPDATE 2026-08-27 — the original "hand braced on the bent knee" no longer complies with the stricter Hard Requirement 3. Corrected: one hand hovering open beside the bent knee WITHOUT touching it, other hand relaxed at the side — never resting on the hip/waist or the knee, in any angle
- **torso_angle:** three-quarter turn, weight shifted directly over the loaded leg
- **head_orientation:** turned toward the loaded side, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side, engaged
- **weight_distribution:** heavily loaded onto the bent leg, sideways rather than forward
- **recommended_framing:** full_front — the side-to-side stance needs the whole body in frame. Confirmed eligible per Hard Requirement 15
- **garment_visibility_priority:** shows leg-line stretch and inseam behavior under the lateral load, distinct from the forward-leaning `wide_skater_lunge_hands_clasped_pose`

---

## golf_glove_adjustment_pose
**Label:** Golf — Adjusting Glove, Standing

**Priority:** 19

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, accessory
- Categories: polos, trousers, shorts

**Params:**
- **stance:** standing straight, weight even, grounded
- **hand_placement:** one hand adjusting a golf glove (accessory) worn on the other hand, fingers pulling the glove snug — hands touch the glove, not the garment
- **torso_angle:** three-quarter turn
- **head_orientation:** tilted down, following the hands — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, focused on the glove
- **recommended_framing:** front_upper_crop, chest-to-waist — the glove-adjustment gesture is the focal detail
- **garment_visibility_priority:** keeps the polo placket and collar legible while the hands stay low and centered

---

## barbell_loaded_lunge_pose
**Label:** Forward Lunge Beside a Grounded Barbell

**Priority:** 20

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, sweatshirts & hoodies, shorts, sweatpants
- Fit: fitted, slim, relaxed
**Avoid when:**
- Categories: trousers, jackets, suits
- Bottom category: sweatpants with Fit: relaxed (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; a forward lunge doesn't suit a loose/relaxed bottom, even on `front_lower_crop` — see RCA Log Entry 4)

**Params:**
- **stance:** forward lunge stance, front knee bent and loaded, back leg extended, standing directly beside a barbell resting on the floor
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one hand held open beside the front thigh WITHOUT touching it, other arm relaxed at the side — the barbell stays grounded, never lifted mid-pose
- **torso_angle:** three-quarter turn, weight forward over the lead leg
- **head_orientation:** turned down toward the barbell or toward the working leg — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, focused
- **weight_distribution:** loaded onto the front leg
- **recommended_framing:** front_lower_crop, hip-to-shoe — the lunge line and the grounded barbell both need to read at leg height
- **garment_visibility_priority:** shows short/legging inseam stretch and shoe construction in a genuine strength-training context

---

## crouched_dual_dumbbell_hold_pose
**Label:** Crouched Stance, Dumbbells Held at Knee Height

**Priority:** 21

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, tank tops, sweatshirts & hoodies
- Fit: fitted, regular, relaxed

**Params:**
- **stance:** low crouch, knees bent, weight settled low and centered
- **hand_placement:** both hands gripping a dumbbell (equipment) each, held low near the knees — the dumbbells, not the hands, are near the legs
- **arm_position:** both arms bent, elbows tracking outside the knees
- **torso_angle:** forward-leaning, three-quarter turn
- **head_orientation:** turned down toward the dumbbells, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, absorbed in the movement
- **weight_distribution:** low, evenly balanced between both feet
- **recommended_framing:** front_upper_crop, chest-to-thigh — the crouch and dual-dumbbell hold are the focal action
- **garment_visibility_priority:** shows shoulder and sleeve behavior under the loaded crouch, distinct from the single-arm curl entries

---

## standing_dumbbell_curl_bent_elbow_pose
**Label:** Standing Dumbbell Curl, Bent Elbow at Shoulder

**Priority:** 22

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, sweatshirts & hoodies, tank tops
- Fit: fitted, slim, relaxed

**Params:**
- **stance:** standing straight, weight even, grounded
- **hand_placement:** one hand curling a dumbbell (equipment) up toward the shoulder, elbow bent and close to the torso; other arm relaxed at the side, not touching garment
- **arm_position:** working arm fully flexed, forearm and bicep visibly engaged
- **torso_angle:** slight three-quarter turn toward the working arm
- **head_orientation:** turned toward the working side, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct at camera or downward toward the curl
- **recommended_framing:** front_upper_crop, chest-to-waist — tight enough to show the curl and sleeve strain
- **garment_visibility_priority:** shows shoulder-seam and sleeve-hem behavior under the flexed bicep, distinct from the forward-leaning `weighted_equipment_curl_pose`

---

## jump_rope_side_profile_pose
**Label:** Jump Rope, Side Profile Mid-Motion

**Priority:** 23

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top
- Categories: sweatshirts & hoodies, tank tops, t-shirts
- Fit: fitted, slim, relaxed
**Avoid when:**
- Categories: trousers, jackets, suits

**Params:**
- **stance:** standing, weight settled on the balls of both feet, side profile to the camera
- **hand_placement:** both hands holding jump-rope handles (equipment) low at the hips, rope trailing to the side, a held moment in the motion rather than mid-jump — the handles, not the hands directly, are near the hips
- **torso_angle:** profile, upright and grounded
- **head_orientation:** level or turned slightly toward camera — vary the exact degree/side across the two generated variants
- **gaze_direction:** forward, focused
- **weight_distribution:** even, both feet grounded
- **recommended_framing:** full_back — the profile stance reads equally well from a rear three-quarter angle; a contained, standing pose, not the wide-stance pattern Hard Requirement 15 excludes
- **garment_visibility_priority:** shows the garment's side-seam and hem behavior under the rope's swinging motion

---

## seated_dumbbell_curl_pose
**Label:** Seated Dumbbell Curl, Close Crop

**Priority:** 24

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, tank tops
- Fit: fitted, slim

**Params:**
- **stance:** seated, torso upright, elbows braced near the torso
- **hand_placement:** one hand curling a dumbbell (equipment) close to the chest; other hand held open, hovering near the thigh WITHOUT touching it (updated 2026-08-27, Hard Requirement 3)
- **arm_position:** working arm flexed, forearm close to the body
- **torso_angle:** slight three-quarter turn
- **head_orientation:** turned down toward the curl, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, absorbed in the movement
- **recommended_framing:** front_upper_crop, chest-to-waist — a seated close crop, not a full-body shot
- **garment_visibility_priority:** shows chest and shoulder fabric behavior under the seated, close-elbow curl

---

## athleisure_dynamic_motion_pose
**Label:** Dynamic Athleisure Motion and Stretching Stance

**Priority:** 15

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: top, bottom, hero_garment
- Categories: t-shirts, sweatpants, shorts, sweatshirts & hoodies, jackets
- Fit: regular, slim, relaxed
- Length: full-length, above-knee, hip-length
**Avoid when:**
- Roles: outerwear
- Categories: sweatshirts & hoodies, jackets
- Bottom category: sweatpants with Fit: relaxed (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; a lunging/stretching stance with one leg bent or lifted doesn't suit a loose/relaxed bottom — see RCA Log Entry 4)

**Conflicts with:** athleisure_frontal_standing_pose, athleisure_posterior_view_pose

**Params:**
- **stance:** lunging or stretching stance with one leg bent or lifted; when the running variant is selected, use the client-approved running-stride mechanic instead (see `dynamic_sprint_stride_pose`) — always grounded, never an airborne "flying" pose
- **hand_placement:** hands clasped together near the knees without touching them, extended forward in a stretch, or holding accessories (equipment); for the running variant, both hands relaxed and open in a reciprocal drive, never a clenched fist
- **head_orientation:** turned slightly upward and toward the side, following the action trajectory — vary the exact degree/side across the two generated variants
- **torso_angle:** three-quarter turn or profile view; for the running variant, angled diagonally toward the camera or sideways at roughly 45 degrees, never away from the camera
- **gaze_direction:** directed away from camera or focused forward-left
- **weight_distribution:** dynamic, shifting forward or supported on a single planted leg
- **recommended_framing:** front_upper_crop or front_lower_crop for the stretch variant; same, per Hard Requirement 14, for the running variant — never `full_front` or `full_back`
- **movement_suggestion:** stretching or kicking motion, held and controlled; the running variant is a grounded full-sprint drive, never a jump or leap

---

## athletic_hero_garment_pose
**Label:** Athletic Hero Garment Dynamic Presentation

**Priority:** 17

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, shirts, sweatshirts & hoodies
- Fit: regular, slim, relaxed
- Length: hip-length
**Avoid when:**
- Roles: layering_piece
- Categories: trousers, sweatpants
- Fit: oversized
- Length: full-length

**Params:**
- **stance:** feet apart, weight distributed dynamically forward or shifted to one leg
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one hand holding an athletic accessory (equipment), NOT resting on the hip; other hanging relaxed at the side — never in a pocket as the primary look, which reads as casual lifestyle rather than sportswear
- **torso_angle:** three-quarter turn to show garment fit and athletic posture
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **gaze_direction:** direct at camera or focused downward on the accessory
- **weight_distribution:** dynamic, slightly forward or shifted to the front leg
- **occlusion_avoidance:** arms positioned away from the body to reveal logo and chest graphics

---

## athleisure_relaxed_pocket_asymmetry
**Label:** Relaxed Asymmetric Jacket Pose

**Priority:** 18

**Angles:** full_front

**Applies when:**
- Roles: outerwear, top
- Categories: jackets, sweatshirts & hoodies
- Fit: slim, regular
- Closure: zip

**Params:**
- **hand_placement:** CLARIFIED 2026-08-27 (Hard Requirement 3) — one hand fully inserted into the jacket pocket (eligible fallback, not garment contact per se); the other hanging naturally at the side, at hip height, NOT resting on the hip
- **torso_angle:** three-quarter turn relative to the camera
- **head_orientation:** tilted slightly down, turned toward the leading shoulder — vary the exact degree/side across the two generated variants
- **gaze_direction:** directed downward toward the ground
- **weight_distribution:** relaxed contrapposto, weight on the back leg
- **shoulder_alignment:** slight forward roll on the pocketed-hand side
- **occlusion_avoidance:** the pocketed hand must not distort the jacket's hemline or front closure

---

## static_full_body_pose
**Label:** Static Full-Body Neutral Presentation

**Priority:** 25

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, base_layer, outer layer, top, bottom, outerwear, shoes
- Categories: t-shirts, shirts, jackets, sweatpants, trousers, shorts, sweatshirts & hoodies, shoes
- Fit: regular, slim, relaxed
- Length: full-length, above-knee, hip-length
**Avoid when:**
- Roles: layering_piece, dress
- Categories: dresses, skirts
- Fit: skin-tight

**Params:**
- **stance:** standing straight, feet shoulder-width apart
- **hand_placement:** both arms hanging relaxed at the sides, fingers slightly curled — this is the pure neutral-stand register, kept distinct from `athleisure_frontal_standing_pose`'s pocket variant
- **torso_angle:** facing camera directly
- **head_orientation:** vary across variants — level and facing forward on one, chin tilted subtly down or head turned slightly to one side on the other
- **gaze_direction:** direct, looking straight into the camera, or following the head tilt/turn
- **weight_distribution:** balanced evenly across both feet
- **shoulder_alignment:** level
- **garment_visibility_priority:** full front silhouette and vertical drape visible
- **recommended_framing:** full_front — the fallback/baseline frontal shot, not the default register in this file

---

## rear_view_silhouette_pose
**Label:** Rear View Garment and Back Detail Presentation

**Priority:** 26

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, outer layer, top, bottom
- Categories: t-shirts, shirts, jackets, sweatshirts & hoodies, sweatpants, trousers, shorts, shoes
- Fit: regular, relaxed, slim
- Length: full-length, above-knee, hip-length
**Avoid when:**
- Roles: accessory

**Conflicts with:** athleisure_frontal_standing_pose

**Params:**
- **stance:** standing straight, feet shoulder-width apart or slightly apart
- **torso_angle:** facing away from camera
- **head_orientation:** turned to a near-profile or over-the-shoulder angle — favor this over a flat, un-turned back-of-head
- **hand_placement:** arms hanging relaxed at sides, or one hand in a pocket — never resting on the hip/waist, in any angle (Hard Requirement 3)
- **gaze_direction:** not visible (back to camera)
- **weight_distribution:** even weight distribution across both legs
- **garment_visibility_priority:** back yoke, branding, and rear garment drape must remain fully visible
- **recommended_framing:** full_back — the fallback/baseline rear shot

---

## athleisure_frontal_standing_pose
**Label:** Frontal Standing Athleisure Presentation

**Priority:** 27

**Angles:** full_front

**Applies when:**
- Roles: top, outerwear, bottom, hero_garment
- Categories: t-shirts, sweatshirts & hoodies, jackets, trousers, sweatpants, shorts, shoes
- Fit: relaxed, regular
- Length: full-length, above-knee, hip-length
**Avoid when:**
- Roles: dress
- Categories: dresses, skirts

**Conflicts with:** athleisure_dynamic_motion_pose, athleisure_posterior_view_pose, rear_view_silhouette_pose

**Params:**
- **stance:** standing straight, feet shoulder-width apart, flat on the ground, weight subtly shifted to one side
- **hand_placement:** one hand in a pocket, the other hangs relaxed at the side — deliberately distinct from `static_full_body_pose`'s pure arms-at-sides look. Never resting on the hip/waist, in any angle (Hard Requirement 3)
- **head_orientation:** frontal and level on one variant, subtly tilted or turned on the other
- **torso_angle:** facing camera
- **gaze_direction:** direct, looking straight into the camera
- **weight_distribution:** even weight distribution across both feet
- **occlusion_avoidance:** arms kept clear of the torso to ensure full visibility of graphic prints and logos

---

## athleisure_posterior_view_pose
**Label:** Posterior View Athleisure Presentation

**Priority:** 28

**Angles:** full_back

**Applies when:**
- Roles: top, outerwear, bottom, hero_garment
- Categories: t-shirts, sweatshirts & hoodies, jackets, trousers, sweatpants, shorts
- Fit: relaxed, regular, slim
- Length: full-length, above-knee, hip-length
**Avoid when:**
- Roles: dress
- Categories: dresses, skirts

**Conflicts with:** athleisure_frontal_standing_pose, athleisure_dynamic_motion_pose

**Params:**
- **stance:** standing straight, feet slightly apart, oriented away from camera
- **hand_placement:** arms resting naturally at sides, or one hand in a pocket — never resting on the hip/waist, in any angle (Hard Requirement 3)
- **head_orientation:** turned to a near-profile or over-the-shoulder angle, varied across variants
- **torso_angle:** facing away from camera (posterior view)
- **gaze_direction:** not visible, directed away from camera
- **garment_visibility_priority:** rear garment details, back panels, branding, and hem draping must be fully unobstructed

---

## profile_casual_pose
**Label:** Profile and Three-Quarter Casual Presentation

**Priority:** 29

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, jackets, trousers
- Fit: regular, relaxed
- Length: full-length, hip-length

**Params:**
- **stance:** standing straight and grounded, both feet planted — never a walking or mid-stride gait
- **torso_angle:** profile left or three-quarter right turn
- **head_orientation:** turned downward and forward or facing camera
- **hand_placement:** hand in a pocket, or gripping a bag strap (equipment) when one is loaded — never resting on the hip/waist, in any angle (Hard Requirement 3)
- **gaze_direction:** averted downward or direct at camera
- **weight_distribution:** balanced evenly or slight weight shift

---

## three_quarter_turn_accessory_pose
**Label:** Three-Quarter Turn Accessory Interaction Pose

**Priority:** 30

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, bag, top, bottom
- Categories: t-shirts, sweatshirts & hoodies, jackets, shorts, trousers, bags
- Fit: regular, relaxed
- Length: full-length, above-knee, hip-length
**Avoid when:**
- Categories: dresses, skirts

**Params:**
- **stance:** standing flat, feet in a three-quarter orientation
- **hand_placement:** one hand touching or holding the strap of a worn bag (equipment), or in a pocket — never resting on the hip/waist, in any angle (Hard Requirement 3)
- **torso_angle:** three-quarter turn to display garment profile and accessories
- **weight_distribution:** balanced evenly or shifted slightly to support the turn
- **head_orientation:** turned sharply or angled to look backward over the shoulder or toward the camera — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct or averted sideways, looking away from camera
- **occlusion_avoidance:** arm positioned to avoid blocking side branding or bag straps

---

## athleisure_seated_relaxed_pose
**Label:** Seated Floor Athleisure Presentation

**Priority:** 35

**Angles:** full_front

**Applies when:**
- Roles: outerwear, bottom
- Categories: sweatshirts & hoodies, trousers
- Fit: relaxed
- Length: full-length, hip-length
**Avoid when:**
- Roles: footwear
- Categories: shoes

**Conflicts with:** athleisure_frontal_standing_pose

**Params:**
- **stance:** sitting on the floor, knees bent and drawn up
- **hand_placement:** hands resting clasped near the knee, not touching it — hands touch each other, not garment
- **head_orientation:** turned slightly toward the camera with a gentle tilt — vary the exact degree/side across the two generated variants
- **torso_angle:** three-quarter right turn
- **gaze_direction:** direct gaze toward the camera
- **weight_distribution:** seated balance, weight supported by hips and legs on the floor
- **seated_variation:** floor sitting with three-quarter crop framing

---

## athleisure_hands_behind_back_static
**Label:** Static Squared Pose with Hidden Hands

**Priority:** 36

**Angles:** full_front

**Applies when:**
- Roles: top, bottom
- Categories: t-shirts, shorts
- Fit: regular, relaxed

**Params:**
- **stance:** standing straight, legs spaced shoulder-width apart
- **hand_placement:** both hands positioned behind the back, clasped at the lower back — hands touch each other, not garment
- **torso_angle:** facing directly toward the camera
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **shoulder_alignment:** squared and pulled back to open the chest area
- **weight_distribution:** centered and stable
- **cropping_preference:** three-quarter shot (chest to below knees) to focus on the top-and-bottom interaction
- **body_line:** clean vertical lines emphasizing the silhouette of the top-and-bottom set

---

## set_presentation_contrapposto
**Label:** Relaxed Tonal Set Presentation

**Priority:** 45

**Angles:** full_front

**Applies when:**
- Roles: set_piece, hero_garment
- Categories: t-shirts, shorts, sweatshirts & hoodies, sweatpants
- Fit: relaxed

**Params:**
- **stance:** feet roughly shoulder-width apart, one leg may be slightly bent
- **weight_distribution:** subtle contrapposto, weight biased toward one hip
- **hand_placement:** one hand tucked into a pocket with thumb visible, other hand hanging relaxed — LAST-RESORT ONLY: pocketed hands stay low-priority and should not be selected when any more athletic-register entry is eligible
- **torso_angle:** slight three-quarter turn to the camera
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **pose_energy:** relaxed and poised, suitable for lifestyle/athleisure marketing
- **negative_space:** captured to show the drape of untucked hems against the bottom garment

---

## urban_utilitarian_relaxed_pose
**Label:** Urban Utilitarian Relaxed Pose

**Priority:** 46

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, outerwear, bottom
- Categories: jackets, trousers, sweatpants, sweatshirts & hoodies, jeans, shorts, bags
- Fit: relaxed, oversized, boxy, wide-leg
**Avoid when:**
- Categories: swimwear

**Params:**
- **stance:** feet wider than shoulder-width, slightly asymmetric foot direction or profile/three-quarter lean
- **hand_placement:** hands tucked into front jacket or trouser pockets, or gripping a bag handle (equipment) at the side — LAST-RESORT ONLY: pocketed hands stay low-priority and should not be selected when any more athletic-register entry is eligible
- **torso_angle:** facing camera or slight three-quarter turn to showcase side seams
- **weight_distribution:** weight shifted to one hip (contrapposto) for a relaxed, lifestyle silhouette
- **head_orientation:** tilted slightly downward, gaze can be averted or direct — vary the exact degree/side across the two generated variants
- **shoulder_alignment:** relaxed, slightly dropped or rolled forward to accommodate oversized volume
- **cropping_preference:** full body or three-quarter to show the stacking behavior of trousers at the footwear
- **garment_visibility_priority:** emphasizes volume, pocket utility, and layered texture of technical streetwear

---

## sumo_squat_hip_prop_hold_pose — CROSS-FILE ENRICHMENT 2026-08-27
**Label:** Wide Sumo Squat with Prop Held at the Hip

**Priority:** 16

**Angles:** front_upper_crop, front_lower_crop

**Ported from the Female file's `sumo_squat_prop_hold_pose`.** The wide sumo-squat mechanic and hip-prop equipment interaction is fully gender-neutral — not sourced from this file's own 73-image reference set, added to close a real gap (Male had zero squat entries) per Sunny's 2026-08-27 direction to cross-enrich thin coverage where a pose is ground-truth-compliant and not gender-specific. Re-parameterized for Male garment categories.

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, shorts
- Fit: fitted, slim, athletic-fit
**Avoid when:**
- Categories: dresses, skirts, trousers
- Bottom category: sweatpants, joggers with Fit: relaxed (role-scoped — same relaxed-bottom exclusion as every other wide-stance entry in this file, per RCA Log Entry 4)

**Params:**
- **stance:** wide sumo-squat stance, feet well beyond shoulder-width, knees bent and tracking over the toes
- **hand_placement:** one hand/forearm cradling a small prop (water bottle, weight, or equivalent) against the hip — the prop, not the hand, contacts the body, fine per Hard Requirement 3; other hand hovering open beside the opposite bent knee, NOT touching it
- **torso_angle:** slight forward lean, chest open
- **head_orientation:** turned to the side, focused off-camera — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side, alert
- **weight_distribution:** evenly loaded across the wide stance, low center of gravity
- **recommended_framing:** front_upper_crop, chest-to-thigh — the wide-leg geometry needs the crotch-to-knee line in frame — OR, when shorts are the hero garment, front_lower_crop instead, so the full leg line and hem are captured rather than cropped at the thigh (Hard Requirement 16)
- **garment_visibility_priority:** shows the short's rise and t-shirt hem behavior under the deep bend; on `front_lower_crop`, extends to full leg-line and hem visibility

---

## deep_squat_hands_clasped_pose — CROSS-FILE ENRICHMENT 2026-08-27
**Label:** Deep Squat with Hands Clasped

**Priority:** 17

**Angles:** front_upper_crop

**Ported from the Female file's `deep_squat_prayer_hands_pose`.** A plain deep squat with clasped hands is fully gender-neutral — added to close a real gap per Sunny's direction.

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, tank tops
- Fit: fitted, slim, relaxed

**Params:**
- **stance:** deep squat, profile-to-three-quarter orientation, hips low and back
- **hand_placement:** both hands clasped together at chest height, elbows resting near or on the inner knees (elbow contact is not governed by Hard Requirement 3, which is hand-specific)
- **torso_angle:** profile-to-three-quarter, leaning slightly forward over the clasped hands
- **head_orientation:** turned toward camera, chin level — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct or slightly averted, focused
- **weight_distribution:** balanced low over both feet
- **recommended_framing:** front_upper_crop, chest-to-knee
- **garment_visibility_priority:** shows short-hem behavior and shorts waistband under a deep bend

---

## bird_dog_kneeling_extension_pose — CROSS-FILE ENRICHMENT 2026-08-27
**Label:** Quadruped Kneeling Leg Extension (Bird-Dog)

**Priority:** 18

**Angles:** front_lower_crop

**Ported from the Female file, same name.** A gender-neutral floor-based training position, fills a real gap — Male had no kneeling/floor entry at all beyond the football-dribble crouch.

**Applies when:**
- Roles: hero_garment, bottom
- Categories: shorts, joggers

**Params:**
- **stance:** kneeling on all fours (quadruped), one leg extended straight back at hip height, opposite knee grounded
- **torso_angle:** profile, torso level and stable over the grounded arm/knee
- **hand_placement:** grounded arm braced flat on the floor/mat (not garment — fine); other arm may extend forward or stay grounded per the crop
- **head_orientation:** level, following the line of the torso — vary the exact degree/side across the two generated variants
- **gaze_direction:** down and forward, focused
- **weight_distribution:** supported through the grounded knee and hand, extended leg weightless
- **recommended_framing:** front_lower_crop — hip-to-heel, the extended-leg line is the entire story
- **garment_visibility_priority:** shows the short's back-panel seam and stretch under full hip extension

---

## boxing_guard_crouch_pose — CROSS-FILE ENRICHMENT 2026-08-27
**Label:** Boxing Guard Crouch, Fists Raised

**Priority:** 19

**Angles:** front_upper_crop, front_lower_crop

**Ported from the Female file, same name.** A boxing/combat-training stance is fully gender-neutral and arguably under-represented for Male specifically — fills a real gap per Sunny's direction.

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, shorts

**Params:**
- **stance:** athletic boxing stance, knees bent, feet staggered, weight low and balanced
- **hand_placement:** both fists raised near the chin/chest in a guard position, NOT touching the chest garment, elbows in
- **torso_angle:** three-quarter turn, shoulders squared to the lead side
- **head_orientation:** level, chin slightly tucked, focused forward — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct at camera or forward, intense and alert
- **weight_distribution:** low, evenly balanced between the staggered feet
- **recommended_framing:** front_upper_crop, chest-to-waist — OR, when shorts are the hero garment, front_lower_crop instead, so the staggered-stance leg line and hem are fully captured (Hard Requirement 16)
- **garment_visibility_priority:** shows the t-shirt/tank hem line and shoulder mobility under the guard position; on `front_lower_crop`, extends to full leg-line and hem visibility

---

## resistance_band_chest_pull_pose — CROSS-FILE ENRICHMENT 2026-08-27
**Label:** Resistance Band Chest-Height Pull

**Priority:** 20

**Angles:** front_upper_crop

**Ported from the Female file, same name.** Male had zero resistance-band content despite it being a common, gender-neutral training accessory — fills a real gap per Sunny's direction.

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, shorts

**Params:**
- **stance:** standing, weight settled, torso squared to camera
- **hand_placement:** both hands gripping resistance-band handles (equipment) held at chest height, palms up, elbows bent and slightly forward
- **torso_angle:** frontal, chest open
- **head_orientation:** tilted slightly down toward the hands or level, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct or downward, absorbed in the exercise
- **weight_distribution:** even, grounded
- **recommended_framing:** front_upper_crop, chest-to-waist
- **garment_visibility_priority:** keeps the t-shirt/tank hem and shorts waistband visible under the chest-forward pull

---

## side_plank_extended_reach_pose — CROSS-FILE ENRICHMENT 2026-08-27
**Label:** Side Plank, Top Arm Extended

**Priority:** 21

**Angles:** front_lower_crop

**Ported from the Female file, same name.** Male's only plank variant was the front plank (`plank_position_floor_pose`) — a side plank fills real crop-angle variety per Sunny's direction.

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, shorts

**Params:**
- **stance:** side plank, supported on one forearm/hand and the outer edge of the lower foot, body forming a straight diagonal line
- **hand_placement:** top arm extended straight up toward the ceiling; supporting arm braced flat on the floor/mat (not garment)
- **torso_angle:** profile, laterally extended
- **head_orientation:** turned up toward the extended arm or level toward camera — vary the exact degree/side across the two generated variants
- **gaze_direction:** upward or direct, focused
- **recommended_framing:** front_lower_crop, hip-to-foot — the diagonal body line and leg stack are the focal detail
- **garment_visibility_priority:** shows the short's side-seam stretch and hem behavior under the extended plank line

---

## standing_one_leg_balance_reach_pose — CROSS-FILE ENRICHMENT 2026-08-27
**Label:** Standing One-Leg Balance, Arms Raised Overhead

**Priority:** 22

**Angles:** front_upper_crop, full_front

**Ported from the Female file, same name.** A balance/mobility pose, gender-neutral, fills a real gap per Sunny's direction.

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, t-shirts, shorts

**Params:**
- **stance:** standing balanced on one leg, opposite foot placed against the inner standing thigh or calf, knee turned out
- **arm_position:** both arms raised straight overhead, palms together or fingers laced
- **torso_angle:** frontal to slight three-quarter, tall and lengthened through the spine
- **head_orientation:** level, facing forward, or tilted gently up toward the raised hands — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct at camera or softly upward, focused and calm
- **weight_distribution:** fully loaded onto the standing leg
- **recommended_framing:** front_upper_crop or full_front — the raised-arm line needs headroom
- **garment_visibility_priority:** stretches the torso panel and underarm construction fully into view
