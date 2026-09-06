# Pose Library — v6

**v6 build notes:** This is the ground-truth-driven rebuild, synthesized from `v4_framework` (last confirmed-good baseline) plus `GROUND_TRUTH_FINDINGS.md` (113-slide deck), `GROUND_TRUTH_2_FINDINGS.md` (76-slide deck, 21 slides reviewed so far), and `RCA_LOG.md`. Every entry below carries a new **`Angles:`** field using the confirmed 5-value vocabulary (`full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`, `all`) — "mood_shot" is retired as a value everywhere in this file; it was never a real angle, only the client's informal name for the dynamic register of the crop angles. Per Sunny's explicit guardrail: **every already-correct pose from v4 is preserved as-is** — only entries touching a confirmed ground-truth violation were changed, and every change is scoped as narrowly as the evidence supports.

**Global pose principles (apply to every rule below) — the BZT FEMALE SPORTS house look is CONTROLLED ATHLETIC ENERGY.** The reference set (78 images: `Full front`, `Full Back` Pose 1/2, `Upper Crop` Pose 1-4, `Lower Crop`) is dominated by real training positions — squats, lunges, crouches, kneeling stretches, overhead reaches, equipment presses — not by standing-still variety. `Full front` and `Full Back` are the one static-leaning batch (confirmed dominant pose: even, grounded standing); every other folder is built around a held, controlled action position. The DEFAULT and correct register here is **dynamic and purposeful**, same as BZT Male Sports — static, level, evenly-weighted stands remain valid as the fallback register (see the neutral/silhouette entries), not the default.

**HARD REQUIREMENTS (mandatory for every variant, every shot — a violation is a hard error):**
1. **CONTROLLED ACTION, NEVER AN ACCIDENT — AND NEVER A WALKING GAIT.** A dynamic pose (squat, lunge, crouch, kneel, reach, jog, stretch) reads as deliberate and held, never a stumble or off-balance wobble. Static entries keep both feet planted flat and grounded. **A walking / mid-stride GAIT — one foot lifted and swinging as if caught mid-step, a lifestyle "walking down the street" look — is PROHIBITED COMPLETELY, on every shot type, with no exception.** Confirmed independently by both the client's original feedback and the ground truth deck ("Walking pose is not acceptable in front and back shot," "the model is abnormally walking... applicable for any angle"). Realistic athletic movement that is NOT a walking gait — running/jogging stride, stretching, warm-up movement — remains in scope, governed by Hard Requirement 14 below.
2. **ASYMMETRY WHEN THE POSE CALLS FOR IT — NEVER FORCED BACK TO LEVEL. BUT A WIDE / OPEN-LEG STANCE NEVER APPEARS ON A SKIRT OR DRESS, WITH NO EXCEPTION.** Follow each entry's own alignment call: lean fully into a squat, lunge, twist, or cocked-hip shift when its Params specify one; render a level/even stance as clean and confident, never stiff or mannequin-like. An even/level stance is not a hard error here — it is simply the lower-priority fallback register. **A confirmed, repeated client rejection, independently reconfirmed by the ground truth deck: any wide-legged, open-stance, or straddle pose (sumo squat, wide lunge, warrior stance, wide side-lunge, hands-on-hips wide stance, deep crouch, etc.) selected for a skirt or dress hero garment is a hard error, full stop.** Every wide-stance-capable entry's `Avoid when` is explicitly **role-scoped to the bottom actually worn** — never satisfied just because a top/hero_garment happens to match, since a matching top must never let an unexamined skirt bottom through. When the hero garment is a skirt or dress, only a narrow/staggered/standing stance is ever acceptable, regardless of what else is eligible by category.
3. **THE HAND NEVER TOUCHES THE GARMENT, IN ANY SHOT, IN ANY ANGLE — NOT GRIPPING, NOT PINCHING, NOT BUNCHING, AND NOT SIMPLY RESTING ON IT EITHER.** Confirmed by Sunny as a hard guardrail, 2026-08-27: "hands cannot touch the garment in any shot... even if it is resting on the garment, it is not allowed." A hand may rest on **bare skin** (an exposed shoulder, arm, or midriff where no garment is present), may hang free without touching the body, may hold a **pocket**, may grip **equipment** (a ball, dumbbell, band, racket, bag — not garment), or may clasp the other hand — but the moment it contacts fabric the model is wearing, including a thigh, hip, knee, or shin covered by leggings/shorts/sweatpants, it is a hard error. Equipment interaction is still functional, never fidgety, and matched to the garment's actual sport — gripping a pilates ball, dumbbell, resistance band, or racket exactly as an entry's Params describe is correct and purposeful, but only when it matches the sport the garment belongs to. **Note on an earlier, narrower reading:** one ground truth slide (113-slide deck, #9) implied hand-on-knee was acceptable specifically on a crop shot, not front/back — that per-angle nuance is superseded by this later, more sweeping instruction, given with full awareness of the earlier slide. This is a deliberate supersession by a more authoritative, more recent, explicit client ruling, not an unnoticed contradiction.
4. **EXPRESSION — ALIVE, ENGAGED, AND NATURAL, NEVER BLANK, LOST, OR EDITORIAL.** A present, quietly confident, relaxed athletic model, energy matched to the pose — neutral and grounded, never a glamorous, theatrical, or fashion-editorial expression, and never heavy/stylized makeup. Blank, vacant, or frozen is a hard error; vary it naturally across variants.
5. **HEAD & GAZE MATCH THE POSE'S OWN CALL, NEVER DEAD-LOCKED — AND THIS IS THE PRIMARY SOURCE OF VARIETY BETWEEN THE TWO VARIANTS ON A SHOT.** Follow each entry's own `head_orientation`/`gaze_direction`, and where an entry lists more than one option, the two generated variants for that shot must land on visibly different ones — never an identical head/gaze repeated on both. Applies on EVERY shot type, `full_back` included: a flat, un-turned back-of-head on every variant is a confirmed client rejection. On `full_front`, alternate between a level direct-to-camera look and a naturally tilted/turned head rather than defaulting to direct-and-level every time. **UPDATED 2026-08-27 per the ground truth deck:** a downward/eyes-lowered gaze (vocabulary options 4 and 6 below) is eligible but is now a **discouraged, lower-preference option**, not an equal-weight default — two ground truth slides marked an otherwise-good shot "Acceptable, but the model should not look down." Draw the actual choice from the **Head-movement vocabulary** below, favoring the non-downward options as the default.
6. **FRAMING FOLLOWS THE SHOT TYPE — AND HANDS ARE NEVER CLIPPED BY THE FRAME EDGE.** `full_front` and `full_back` keep feet in frame; `front_lower_crop` keeps feet/legs in frame; `front_upper_crop` is waist-up by definition — never force feet into it, and never crop a full-body entry's stance down to lose the detail it was written for. On every crop type, whenever a pose's own Params call for a raised, extended, or driven arm, the subject must be positioned with enough lateral margin that the hand stays completely inside the frame.
7. **EVERY LOADED ITEM MUST BE PLACED AND CARRIED — THIS OUTRANKS PRIORITY.** A pilates ball, dumbbell, resistance band, racket, bag, or bottle that's loaded needs an explicit placement in the selected entry's Params. An entry that leaves hands empty must not be picked over an eligible entry that carries the item, even at a lower Priority.
8. **`AVOID WHEN` / `CONFLICTS WITH` ARE BINDING; VARIANTS DIFFER BY POSE, NOT ITEM COUNT.** Neither is advisory — never override an `Avoid when` match for a Priority win, and never drop an item in one variant that another variant of the same shot shows.
9. **NO EXAGGERATED OR PHYSICALLY IMPOSSIBLE POSES.** Every entry — including every dynamic one — is a real, achievable human training position. A backward spinal arch / backbend is EXCLUDED from this file entirely. Do not re-add a backbend pose without a QC sign-off flag.
10. **NO GARMENT-HOLDING, EVEN AS A "STYLING" POSE.** A hem-grip or fabric-pinch pose is doubly excluded — both by this rule and by Hard Requirement 3.
11. **FOOTWEAR MATCHES THE ACTIVITY.** Shoes shown in any full-body or lower-body shot must plausibly match the sport implied by the hero garment and any equipment in frame. Barefoot is a confirmed rejection, independently reconfirmed by the ground truth deck ("Bare feet is not acceptable") — never an arbitrary or mismatched shoe, never barefoot.
12. **NATURAL HAIR, NEVER RESTYLED; NO OVERSTYLING.** Keep the model's reference hairstyle exactly as shown — never restyle it into an elaborate or editorial look. No glamorous posing, no theatrical flourish.
13. **HANDS-IN-POCKET IS AN ELIGIBLE FALLBACK, NOT A DEFAULT — AND HANDS ARE NEVER ON THE HIP/WAIST, IN ANY ANGLE.** **UPDATED 2026-08-27:** the ground truth deck rejects hand-on-hip/waist placement ~30 times, in every angle, with no exception — this is now a hard error, not a style option (supersedes any earlier reading that treated hip-rest as acceptable body contact). By elimination, and consistent with 5 client-approved reference images logged 2026-08-26 (all showing pocket hands), pocket is restored as an eligible fallback gesture. It draws from a **shared, rotating fallback-gesture pool** (pocket, relaxed-at-sides, equipment-carry, clasped hands) alongside every other low-priority fallback entry — never the first-listed or most-frequent choice on its own, never identical across both variants of a shot, and never allowed to become the new dominant gesture in hip's place.
14. **RUNNING IS ELIGIBLE ON CROP SHOTS ONLY, NEVER ON `full_front`/`full_back` — AND ONLY THE DIAGONAL/SIDEWAYS MECHANIC, NEVER FORWARD-FACING.** **UPDATED 2026-08-27:** the ground truth deck confirms running is rejected in forward-facing direction "in any angle," but a side/diagonal running mechanic is explicitly accepted on crop shots. The file's approved running mechanic (`athletic_dynamic_stride_pose`) was already diagonal/sideways, so the stance itself is unchanged — only its angle eligibility is now correctly stated as `front_upper_crop`/`front_lower_crop`, never `full_front`/`full_back`. NEVER a "flying" pose — the stride must always read as grounded, one foot in contact with or just leaving the ground.
15. **`full_back` NEVER CARRIES A WIDE-STANCE, HIGH-MOVEMENT DYNAMIC POSE — VERIFIED BY DIRECT EVIDENCE, NOT SOFT DEFAULT.** The ground truth deck rejects wide-stance, high-movement `full_back` poses 10 times explicitly, with no exception. This is a hard boundary, not a soft lean. `full_front` has **no equivalent evidenced restriction** — direct ground truth evidence (multiple slides marked "the movement is good to go" on full-body, front-facing dynamic poses) confirms movement is acceptable there; `full_front`'s existing lean toward static/neutral entries is a soft default from the original reference set, not a ground-truth-mandated ban. Three entries that were originally written as dynamic `full_back` options (`warrior_lunge_arms_extended_back_pose`, `side_lunge_prop_hip_hold_back_pose`, `standing_side_angle_stretch_back_pose`) have been adapted into crop variants in this v6 build — see each entry's note.
16. **THE HERO GARMENT MUST NEVER BE STRUCTURALLY CROPPED OUT OF FRAME — `front_upper_crop` AND `front_lower_crop` ARE NOT INTERCHANGEABLE FOR A BOTTOM-CATEGORY HERO GARMENT.** Added 2026-08-27, per Sunny's direct instruction and the two angle-definition files' own text. `BZT_FRONT_UPPER_CROP_SPORTS.md`'s own coverage note: "Lower garments are cropped to show the waistband, rise, and upper thigh area" — correct and expected when a TOP is the hero garment and the bottom is secondary/styling context, but this framing **cannot** show a bottom garment's hem, inseam, or full leg line. `BZT_FRONT_LOWER__CROP_SPORTS.md` is the angle that guarantees this: "The entire length of the garment is captured, including hemlines, side seams, and specialized cuffs or inner linings." **Rule: whenever the hero garment for a given job is a bottom-category item (shorts, leggings, tights, sweatpants), that job must never be routed to a pose whose only eligible angle is `front_upper_crop`** — either select an entry that also lists `front_lower_crop` (or `full_front`/`full_back`) among its `Angles`, or if the desired pose's mechanic is `front_upper_crop`-only, do not use it for a bottom-hero job. The reverse applies symmetrically: a top-category hero garment should not be routed to a `front_lower_crop`-only entry, since that angle only shows "the bottom edge of a top," not the full upper garment. This is a selection-time check, not a per-entry rewrite — most entries below that could plausibly carry a bottom-category hero garment (wide stances, squats, lunges) have been given a `front_lower_crop` companion angle in this v6 pass specifically so this check has somewhere valid to route to; entries whose stance genuinely doesn't translate to a lower-crop framing (e.g. an overhead reach, a seated curl) were left `front_upper_crop`-only on the assumption their hero garment is normally a top, not a bottom.
17. **EVERY POSE MUST READ AS ONE SINGLE, COHERENT, NATURAL HUMAN ACTION — NEVER AN AWKWARD OR UNRELATED COMBINATION OF GESTURES.** Added 2026-08-28, generalizing a pattern that was previously only patched entry-by-entry. Ground truth confirms this as a real, standing rejection reason distinct from any specific mechanism like hand placement or clothing type: *"The movement does not look natural for any angle"* (`Ground Truth BZT Sports.pptx`) and *"the pose is weird, the model is abnormally walking"* (same deck). This file already carries entry-specific instances of this same failure mode from earlier RCA work — a raised or clenched fist during a lunge counterbalance reading as an unrelated boxing-guard gesture rather than a natural stabilizing hand; a hand tucked behind the lower back during a torso-twist reading as a borrowed, unrelated gesture rather than a natural counter-arm. **Those were real generated outputs, flagged and fixed individually — this requirement generalizes the underlying principle so it isn't limited to the specific instances already caught.** Test: does the full combination of stance, hand placement, torso angle, and head/gaze read as ONE thing a real athlete would actually do in that moment — not as body parts individually valid but assembled from unrelated poses. A pose can satisfy every other Hard Requirement in this file (achievable, not exaggerated, no garment contact, no hip contact) and still fail this one if the overall gesture reads as disjointed or borrowed. This is necessarily a qualitative, not a quantifiable, standard — there is no numeric threshold for "natural" — but it is a hard requirement, not a suggestion: an entry whose Params combination doesn't hold together as one coherent action needs its Params rewritten, not shipped as-is on a technicality.

**Equipment & prop vocabulary (from the BZT Female Sports reference set).** Hands are frequently doing something training-specific. In rough order of frequency: **(1)** one or both hands cradling a small pilates/med ball at the hip (equipment against the body, not a bare hand on garment — fine) or held to one side; **(2)** both hands clasped together at chest height (prayer-hands squat); **(3)** one hand hovering near a bent knee or the front thigh during a lunge or crouch, not touching it (updated 2026-08-27 — bracing directly on the thigh/knee is no longer eligible, see Hard Requirement 3); **(4)** one hand gripping a racket; **(5)** one arm extended overhead in a lateral reach/stretch; **(6)** one arm extended straight forward gripping a dumbbell toward camera; **(7)** both hands gripping resistance-band handles at chest height; **(8)** one hand holding a water bottle low at the side; **(9)** one hand carrying a bag by the handle or on one shoulder; **(10)** a kneeling hand braced on the floor/mat (not garment) with the opposite arm or leg extended (bird-dog). A relaxed hand-at-the-side, a pocketed hand, or hands clasped together is the fallback register — never substitute it for a pose whose own Params call for one of the equipment/training interactions above.

**Head-movement vocabulary (from the BZT reference set, confirmed gender-agnostic — shared verbatim with the Male file).** On front-facing shots (`full_front`, `front_upper_crop`, and any frontal or three-quarter-frontal entry), draw the actual head/gaze call from: **(1)** direct-level frontal, eyes straight at camera; **(2)** level, head/eyes turned to one side without dropping (a pure side-glance); **(3)** turned to one side AND tilted down together, a combined glance; **(4)** chin dropped straight down toward the chest, eyes lowered, no side turn — DISCOURAGED, lower preference per Hard Requirement 5; **(5)** turned toward profile with the chin very slightly lifted; **(6)** head stays level and forward, only the gaze/eyes cast downward — DISCOURAGED, lower preference per Hard Requirement 5. On rear-facing shots (`full_back`), draw from: **(1)** a flat, straight, un-turned back-of-head — fallback only, must never dominate across variants; **(2)** a near-profile turn with the ear visible — the primary recommended back-view movement; **(3)** turned to one side and tilted down, tracking an implied piece of equipment or the ground.

**Shot-type behavior.** `front_upper_crop` carries the dynamic register almost exclusively — nearly every action pose (squat, crouch, reach, press, band-pull, sprint-drive) was sourced from it, and the ground truth deck's own "Do's" slide confirms crop shots need movement, front upper and lower crop alike. `front_lower_crop` is where the kneeling/floor-based leg work lives (bird-dog, kneeling side stretch), same movement requirement. `full_front` is dominated by the still, level stand in the reference images and carries the neutral/silhouette entries as its primary register — a **soft default**, not a hard ban — with dynamic entries fully eligible as secondary full-body variants (ground truth-confirmed: dynamic full_front poses were reviewed and the movement itself was explicitly approved, only isolated defects like hand-on-hip were rejected). `full_back` is now purely static/silhouette register — the ground truth deck's hard, repeated rejection of wide-stance/high-movement back poses (Hard Requirement 15) means `full_back` no longer carries dynamic entries as co-equal options the way it did in the pre-ground-truth reference set; the three formerly-dynamic `full_back` entries were adapted into crop variants instead. **Reinforced 2026-08-28 after reviewing real output:** "secondary" for `full_front`'s dynamic entries means selected occasionally, not as the default landing spot — wide-stance entries (`wide_side_lunge_hands_open_pose`, `lunge_resistance_band_pull_pose`, `warrior_lunge_arms_extended_front_pose`) being eligible is not license to select one every time a dynamic variant is wanted; the static/narrow-stance entries remain the primary register and should be the majority outcome. If selection frequency data ever shows wide-stance entries dominating `full_front` output, that is the same class of problem as the hip-saturation issue in RCA Log Entry 2 — a frequency defect, not a content one, and needs a selection-layer fix, not a file edit.

**Inter-SKU and inter-variant pose variety (each angle has multiple eligible entries on purpose).** Every angle now carries several eligible pose entries at neighboring Priority values specifically so that different SKUs sharing the same angle, and the two variants generated for one shot, don't converge on one repeated pose. Selection should draw from the full eligible set for that angle rather than collapsing back to the single highest-Priority entry every time.

---

## dynamic_lunge_twist_cocked_hip_pose
**Label:** Dynamic Forward Lunge with Torso Twist and Cocked Hip

**Priority:** 1

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, sports bras, sweatshirts & hoodies, shorts, sweatpants, leggings
- Fit: fitted, slim, relaxed
**Avoid when:**
- Categories: dresses, skirts, suits
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches)

**Params:**
- **stance:** forward lunge with the front knee bent and weight-loaded, back leg extended; hip cocked toward the front leg
- **torso_angle:** three-quarter turn with a visible twist away from the lunge direction
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one hand held out at hip height, elbow bent and away from the torso, fingers open and NOT touching the hip or thigh; other arm relaxed at the side or bracing in open air, not touching the body
- **head_orientation:** turned toward the working side, alert and focused — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or averted to the side, high engagement
- **weight_distribution:** heavily loaded onto the front leg
- **recommended_framing:** front_upper_crop, torso-to-thigh, to keep the twist and hip-cock legible — OR, when the bottom garment (leggings, shorts, sweatpants) is the hero garment, front_lower_crop instead, so the full leg line and hem are captured rather than cropped at the thigh (Hard Requirement 16)
- **garment_visibility_priority:** shows waistband transition and torso-panel stretch under the twist; on `front_lower_crop`, extends to full leg-line and hem visibility

---

## sumo_squat_prop_hold_pose
**Label:** Wide Sumo Squat with Prop Held at the Hip

**Priority:** 2

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, sports bras, leggings, tights
- Fit: fitted, skin-tight
**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses, sweatpants (relaxed/loose) (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; see RCA Log Entry 1 for the loose-sweatpants case and Entry 3 for the skirt case)

**Params:**
- **stance:** wide sumo-squat stance, feet well beyond shoulder-width, knees bent and tracking over the toes
- **hand_placement:** one hand/forearm cradling a small prop (pilates ball or equivalent) against the hip — the prop, not the hand, contacts the body, which is fine (equipment interaction, Hard Requirement 3); other hand hovering open beside the opposite bent knee, NOT touching the leg (updated 2026-08-27)
- **torso_angle:** slight forward lean, chest open
- **head_orientation:** turned to the side, focused off-camera — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** averted to the side, alert
- **weight_distribution:** evenly loaded across the wide stance, low center of gravity
- **recommended_framing:** front_upper_crop, chest-to-thigh — the wide-leg geometry needs the crotch-to-knee line in frame — OR, when leggings/tights are the hero garment, front_lower_crop instead, so the full leg line and hem are captured rather than cropped at the knee (Hard Requirement 16)
- **garment_visibility_priority:** shows the high-waist leggings' stretch and the crop top's underbust line under the deep bend; on `front_lower_crop`, extends to full leg-line and ankle-cuff visibility

---

## deep_squat_prayer_hands_pose
**Label:** Deep Squat with Hands Clasped at Chest

**Priority:** 3

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, tank tops, sports bras
- Fit: fitted, slim, relaxed

**Params:**
- **stance:** deep squat, profile-to-three-quarter orientation, hips low and back
- **hand_placement:** both hands clasped together at chest height (prayer position) — hands touch each other, not the garment; elbows may rest near or on the inner knees (elbow contact is not governed by Hard Requirement 3, which is hand-specific)
- **torso_angle:** profile-to-three-quarter, leaning slightly forward over the clasped hands
- **head_orientation:** turned toward camera, chin level — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or slightly averted, focused
- **weight_distribution:** balanced low over both feet
- **recommended_framing:** front_upper_crop, chest-to-knee, to keep the clasped-hands focal point and the resistance-band-at-thigh detail (when present) legible
- **garment_visibility_priority:** shows crop-hem behavior and legging waistband under a deep bend

---

## forward_bent_equipment_crouch_pose
**Label:** Forward-Bent Equipment Crouch

**Priority:** 4

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, bottom, accessory
- Categories: tank tops, sports bras, shorts, headwear

**Params:**
- **stance:** knees bent, torso hinged forward and down toward the equipment
- **hand_placement:** one hand gripping a racket (or equivalent equipment, not garment) resting near a bent knee; other hand hovering open beside the opposite knee, NOT resting on it (updated 2026-08-27)
- **torso_angle:** deep forward hinge, three-quarter turn
- **head_orientation:** turned to the side, alert, tracking off-camera — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** averted to the side, high focus
- **weight_distribution:** low, weight forward over the bent knees
- **recommended_framing:** front_upper_crop, chest-to-thigh
- **garment_visibility_priority:** shows the bra/tank underbust line and short's rise under the forward hinge

---

## overhead_lateral_reach_stretch_pose
**Label:** One-Arm Overhead Lateral Reach and Stretch

**Priority:** 5

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: tank tops, t-shirts, sports bras
- Fit: fitted, slim, cropped

**Params:**
- **stance:** standing, weight settled, torso arched laterally away from the raised arm
- **arm_position:** one arm fully extended overhead, reaching up and slightly back; other arm bent, hand hovering near the opposite hip, NOT resting on it (clarified 2026-08-27, Hard Requirement 3)
- **torso_angle:** three-quarter turn with a lateral (side) stretch, ribcage lengthened
- **head_orientation:** tilted up and toward the raised arm, following the stretch line — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** directed upward, off-camera, absorbed in the stretch
- **weight_distribution:** even, grounded
- **recommended_framing:** front_upper_crop, chest-to-waist, so the full overhead line and underarm/side-seam stretch reads
- **garment_visibility_priority:** stretches the side seam and underarm construction into full view

---

## straight_arm_equipment_press_pose
**Label:** Straight-Arm Equipment Press Toward Camera

**Priority:** 6

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, tank tops, sweatshirts & hoodies
- Fit: fitted, regular

**Params:**
- **stance:** standing, weight settled, torso squared to slightly turned
- **hand_placement:** one arm extended straight toward the camera gripping a dumbbell (equipment, not garment), the hand and equipment closest to the lens; other hand relaxed at the side, NOT resting on the hip (updated 2026-08-27, Hard Requirement 3)
- **arm_position:** working arm fully extended, foreshortened toward camera; supporting arm bent, elbow out
- **head_orientation:** level, direct — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera, composed and confident
- **weight_distribution:** even, grounded
- **recommended_framing:** front_upper_crop, chest-to-waist — the foreshortened arm needs headroom
- **garment_visibility_priority:** shows sleeve/armhole clearance and shoulder-seam construction under full extension

---

## resistance_band_chest_pull_pose
**Label:** Resistance Band Chest-Height Pull

**Priority:** 7

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, shorts, leggings

**Params:**
- **stance:** standing, weight settled, torso squared to camera
- **hand_placement:** both hands gripping resistance-band handles held at chest height, palms up, elbows bent and slightly forward
- **torso_angle:** frontal, chest open
- **head_orientation:** tilted slightly down toward the hands or level, focused — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or downward, absorbed in the exercise
- **weight_distribution:** even, grounded
- **recommended_framing:** front_upper_crop, chest-to-waist
- **garment_visibility_priority:** keeps the sports-bra/tank underbust seam and waistband transition visible under the chest-forward pull

---

## sprint_arm_drive_crop_pose
**Label:** Sprint Mid-Stride Arm Drive (Upper Crop, Tight)

**Priority:** 8

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, accessory
- Categories: t-shirts, tank tops, sweatshirts & hoodies, sleeves, gloves
**Avoid when:**
- Categories: dresses, skirts, trousers

**The tightest-crop adaptation of the client-approved running reference** (see `athletic_dynamic_stride_pose` for the full note). Per Hard Requirement 14, this is eligible on `front_upper_crop` only, framed so the head is never cropped out — same arm/torso mechanic as the reference photo, cropped a little tighter than the primary entry so the legs run mostly out of frame.

**Params:**
- **stance:** captured mid-sprint, grounded and controlled — NEVER an airborne leap with both feet off the ground at once; torso leaning forward into the drive
- **arm_position:** reciprocal arm drive — one arm bent and driven up toward chest height, hand relaxed with fingers loosely spread, never a clenched fist; the other bent and driven back down, equally relaxed, never resting on or touching the hip/garment (Hard Requirement 3)
- **torso_angle:** three-quarter turn at roughly 45 degrees, moving diagonally toward the camera or sideways — never angled or moving away from the camera
- **head_orientation:** turned to a three-quarter angle away from direct camera contact, chin level, focused, and always fully visible in frame — vary the exact degree/side across the two generated variants
- **gaze_direction:** directed off to the side into the distance — not down, not straight at the lens — focused, high intensity
- **weight_distribution:** dynamic, forward-loaded, always grounded
- **recommended_framing:** front_upper_crop, top of head to roughly waist — the head is a hard floor, never cropped out
- **garment_visibility_priority:** shows fabric behavior and sleeve/armhole clearance under real motion

---

## bird_dog_kneeling_extension_pose
**Label:** Quadruped Kneeling Leg Extension (Bird-Dog)

**Priority:** 9

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom
- Categories: leggings, tights, shorts

**Params:**
- **stance:** kneeling on all fours (quadruped), one leg extended straight back at hip height, opposite knee grounded
- **torso_angle:** profile, torso level and stable over the grounded arm/knee
- **hand_placement:** grounded arm braced flat on the floor/mat (not garment — fine); other arm may extend forward or stay grounded per the crop
- **head_orientation:** level, following the line of the torso — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** down and forward, focused
- **weight_distribution:** supported through the grounded knee and hand, extended leg weightless
- **recommended_framing:** front_lower_crop — hip-to-heel, the extended-leg line is the entire story
- **garment_visibility_priority:** shows the legging/short's back-panel seam and stretch under full hip extension

---

## kneeling_side_stretch_hand_thigh_pose
**Label:** Kneeling Side Stretch (name retained for history — hand no longer touches the thigh, see below)

**Priority:** 10

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom
- Categories: shorts, leggings, sweatpants

**Params:**
- **stance:** one knee grounded, opposite leg bent with the foot planted, torso leaning back and to the side over the grounded knee
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one hand extended down along the front thigh line, fingers open, hovering just above the leg WITHOUT touching it; other arm raised or braced behind for support (out of a tight crop)
- **torso_angle:** profile, arched slightly back into the stretch
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** supported through the grounded knee and the planted foot
- **recommended_framing:** front_lower_crop, hip-to-knee — a tight, close crop on the stretch line
- **garment_visibility_priority:** shows the short/legging's waistband and side-seam drape under the side-bend

---

## warrior_lunge_arms_extended_crop_pose
**Label:** Warrior-Stance Lunge, Arms Extended (Crop Adaptation)

**Priority:** 11

**Angles:** front_upper_crop, front_lower_crop

**ADAPTED 2026-08-27 from `warrior_lunge_arms_extended_back_pose` (full_back).** Per Hard Requirement 15, `full_back` cannot carry this wide-stance, high-movement pose — the ground truth deck rejects this exact pattern (wide lunge, arms extended) on `full_back` repeatedly. Sunny confirmed (option 1, 2026-08-27): keep the movement mechanic, relocate to a crop angle rather than retiring it outright. Since the crop-angle vocabulary is front-facing by definition, this also required rewriting the orientation from rear-view to front/three-quarter — it is no longer a back-panel-visibility pose, it's a front-facing dynamic crop pose with the same wide-lunge, arms-extended energy.

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, shorts, leggings
**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches)

**Params:**
- **stance:** wide lunge (front knee bent, back leg straight), both feet grounded and turned per a warrior-style stance
- **arm_position:** both arms extended straight out to the sides at shoulder height, forming a T-line across the frame
- **torso_angle:** facing camera or three-quarter turn — CHANGED from the original rear-view; this angle can no longer host a back-facing torso
- **head_orientation:** turned to the side, following the line of one extended arm — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** loaded onto the front bent leg
- **recommended_framing:** front_upper_crop — the wingspan and lunge read clearly at crop scale; relocated from `full_back` per Hard Requirement 15 — OR, when the bottom garment is the hero garment, front_lower_crop instead, so the full leg line is captured rather than cropped (Hard Requirement 16)
- **garment_visibility_priority:** front torso panel, bra/tank underbust seam, and leg-line read clearly in the extended stance — CHANGED from the original's back-panel/strap-crossing focus, since this is now a front-facing pose; on `front_lower_crop`, extends to full leg-line and hem visibility

---

## side_lunge_prop_hold_crop_pose
**Label:** Side Lunge with Prop Held at the Hip (Crop Adaptation)

**Priority:** 12

**Angles:** front_upper_crop, front_lower_crop

**ADAPTED 2026-08-27 from `side_lunge_prop_hip_hold_back_pose` (full_back).** Same treatment as `warrior_lunge_arms_extended_crop_pose` above — see that entry's note for the full reasoning. Relocated to a front-facing crop angle per Sunny's option-1 confirmation.

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, leggings, tights
**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches)

**Params:**
- **stance:** deep side lunge, one leg bent and loaded, the other extended straight to the side
- **hand_placement:** one hand cradling a small prop (pilates ball or equivalent) at the hip — equipment against the body, fine per Hard Requirement 3; other arm bent naturally at the elbow for balance, hand relaxed and open, hovering near the chest WITHOUT touching it (clarified 2026-08-27) — never a raised or clenched fist, which reads as an unrelated boxing-guard gesture rather than a natural counterbalance for the lunge
- **torso_angle:** facing camera or three-quarter turn — CHANGED from the original rear-view
- **head_orientation:** turned to the side, profile — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** loaded onto the bent leg
- **recommended_framing:** front_upper_crop — relocated from `full_back` per Hard Requirement 15 — OR, when leggings/tights are the hero garment, front_lower_crop instead, so the full leg line is captured rather than cropped (Hard Requirement 16)
- **garment_visibility_priority:** front torso panel, waistband, and the leg line of the extended leg all read clearly — CHANGED from the original's back-panel focus; on `front_lower_crop`, extends to full leg-line and hem visibility

---

## athletic_dynamic_stride_pose
**Label:** Dynamic Running Stride Athletic Presentation

**Priority:** 13

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, sports bras, shorts, leggings
- Fit: fitted, relaxed, slim
**Avoid when:**
- Roles: bottom, footwear
- Categories: trousers, sweatpants, skirts

**Conflicts with:** athletic_standard_frontal_stance, athletic_seated_stretch_pose

**CLIENT-APPROVED REFERENCE — this is the sole approved running-stride mechanic, client-confirmed (same mechanic as the Male file's `dynamic_sprint_stride_pose`). Per Hard Requirement 14:** eligible on `front_upper_crop`/`front_lower_crop` only, never `full_front`/`full_back`. Only the diagonal/sideways mechanic is acceptable, never forward-facing. NEVER a flying pose.

**Params:**
- **stance:** full mid-stride sprint drive, grounded and controlled — NEVER an airborne leap with both feet off the ground at once. Lead leg driven forward and up with a sharp high-knee lift, trail leg extended back and bent, the trailing foot's toe/ball still in contact with or just leaving the ground
- **hand_placement:** both hands relaxed and open, fingers loosely spread — never a clenched fist — one arm bent and driven up toward chest height, the other bent and driven back down, reciprocal with the legs, never resting on or touching the hip/garment (Hard Requirement 3)
- **torso_angle:** three-quarter turn at roughly 45 degrees, moving diagonally toward the camera or sideways across the frame — never angled or moving away from the camera
- **weight_distribution:** dynamic, loaded onto the driving leg mid-transfer, always grounded
- **head_orientation:** turned to a three-quarter angle away from direct camera contact, chin level, focused, and always fully visible in frame — vary the exact degree/side across the two generated variants
- **gaze_direction:** directed off to the side into the distance — not down, not straight at the lens — focused, high intensity
- **pose_energy:** dynamic
- **recommended_framing:** front_upper_crop or front_lower_crop — top of head to roughly mid-thigh, face always fully in frame. Never `full_front` or `full_back`
- **footwear:** when feet are in frame, the model always wears proper running shoes matched to the activity — never barefoot
- **occlusion_avoidance:** arms positioned to maintain a clear view of torso branding and garment lines during motion

---

## standing_one_leg_balance_reach_pose
**Label:** Standing One-Leg Balance, Arms Raised Overhead

**Priority:** 13

**Angles:** front_upper_crop, full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, sports bras, leggings, tights

**Params:**
- **stance:** standing balanced on one leg, opposite foot placed against the inner standing thigh or calf, knee turned out
- **arm_position:** both arms raised straight overhead, palms together or fingers laced
- **torso_angle:** frontal to slight three-quarter, tall and lengthened through the spine
- **head_orientation:** level, facing forward, or tilted gently up toward the raised hands — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or softly upward, focused and calm
- **weight_distribution:** fully loaded onto the standing leg
- **recommended_framing:** front_upper_crop or full_front — the raised-arm line needs headroom
- **garment_visibility_priority:** stretches the torso panel and underarm construction fully into view

---

## grounded_forward_fold_lunge_pose
**Label:** Grounded Forward Fold, Hands on the Floor

**Priority:** 13

**Angles:** front_lower_crop, full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, sports bras, leggings, tights, shorts
**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; a client-confirmed rejection showed a closely related deep-lunge forward-fold stance generated on a pleated tennis skirt)

**Params:**
- **stance:** deep runner's lunge with both hands grounded on the floor/mat in front of the lead foot, rear leg extended straight back
- **torso_angle:** forward-folded, chest toward the lead thigh
- **head_orientation:** down and forward, following the line of the fold — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** downward, absorbed in the stretch
- **weight_distribution:** supported through both hands and the lead foot, rear leg light
- **recommended_framing:** front_lower_crop or full_front — the hands-to-floor line is the entire story
- **garment_visibility_priority:** shows the legging/short's back-panel and waistband stretch under the deep fold

---

## resistance_band_overhead_pull_back_pose
**Label:** Resistance Band Overhead Side Pull (Back View)

**Priority:** 13

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, leggings, tights, shorts

**Conflicts with:** athletic_back_view_pose

**NOTE 2026-08-27:** kept on `full_back`, not adapted — unlike the three entries adapted above, this pose is a standing lateral bend, not a wide-legged stance, so it doesn't clearly match the ground truth's specific "wide-stance" rejection pattern (Hard Requirement 15). Worth a second look if further ground-truth evidence shows this specific movement level is also rejected, but not treated the same as the three wide-stance entries in this pass.

**Params:**
- **stance:** standing, feet grounded, torso bending laterally to one side
- **hand_placement:** both hands gripping resistance-band handles overhead, pulling the band taut to one side
- **torso_angle:** facing away from camera (rear view), leaning laterally into the pull
- **head_orientation:** turned toward the working side, following the line of the pull — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** even, grounded
- **recommended_framing:** full_back
- **garment_visibility_priority:** back-panel seams and strap crossings read clearly under the lateral extension

---

## boxing_guard_crouch_pose
**Label:** Boxing Guard Crouch, Fists Raised

**Priority:** 14

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, sports bras, leggings, tights, shorts

**Params:**
- **stance:** athletic boxing stance, knees bent, feet staggered, weight low and balanced
- **hand_placement:** both fists raised near the chin/chest in a guard position, NOT touching the chest garment (clarified 2026-08-27), elbows in
- **torso_angle:** three-quarter turn, shoulders squared to the lead side
- **head_orientation:** level, chin slightly tucked, focused forward — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or forward, intense and alert
- **weight_distribution:** low, evenly balanced between the staggered feet
- **recommended_framing:** front_upper_crop, chest-to-waist — OR, when leggings/tights/shorts are the hero garment, front_lower_crop instead, so the staggered-stance leg line and hem are fully captured (Hard Requirement 16)
- **garment_visibility_priority:** shows the sports bra/tank underbust line and shoulder mobility under the guard position; on `front_lower_crop`, extends to full leg-line and hem visibility

---

## wide_side_lunge_hands_open_pose — RENAMED 2026-08-27, hand placement corrected twice (hip, then thigh/knee contact)
**Label:** Wide Side Lunge, Hands Open (formerly "Hands on Hips" — name retained for history)

**Priority:** 13

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, sports bras, shorts, sweatpants, leggings
**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; a client-confirmed rejection showed this exact wide side-lunge pose generated on a pleated tennis skirt — see RCA Log Entry 3)

**Params:**
- **stance:** wide side lunge, one leg bent and loaded, the other extended straight to the side, both feet flat
- **hand_placement:** SECOND UPDATE 2026-08-27 — the first fix (hands braced on the thigh/knee) no longer complies with the stricter Hard Requirement 3 confirmed later the same session. Corrected: both hands held open at the sides, at hip height, WITHOUT touching the hip or thigh — fingers spread, palms facing slightly forward, a natural balancing gesture with no body contact
- **torso_angle:** facing camera, chest open
- **head_orientation:** level, facing forward, or turned slightly toward the loaded leg
- **gaze_direction:** direct at camera, confident
- **weight_distribution:** loaded onto the bent leg
- **recommended_framing:** full_front — the wide lateral stance needs the whole body in frame. Confirmed eligible per Hard Requirement 15 — no evidenced `full_front` movement restriction
- **garment_visibility_priority:** shows waistband and leg-line stretch under the lateral load

---

## dynamic_torso_twist_hand_raised_pose
**Label:** Dynamic Torso Twist, Hand Raised in Block

**Priority:** 13

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: tank tops, sports bras, t-shirts

**Params:**
- **stance:** standing, weight shifted, torso twisted sharply to one side mid-direction-change
- **arm_position:** one hand raised near shoulder height in a blocking/reaching gesture; other arm bent naturally at the elbow, driven back at the side for counter-rotation momentum — the hand stays visible near the hip, NOT touching it (clarified 2026-08-27), never tucked behind the lower back either
- **torso_angle:** three-quarter to profile, sharp twist
- **head_orientation:** turned to follow the raised hand, alert — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** averted to the side, high engagement
- **weight_distribution:** dynamic, shifted onto the back foot
- **recommended_framing:** front_upper_crop, chest-to-waist, tight enough that the twist reads as the focal action
- **garment_visibility_priority:** shows torso-panel stretch and underarm construction under the twist

---

## standing_side_angle_stretch_crop_pose
**Label:** Standing Side-Angle Stretch (Crop Adaptation)

**Priority:** 14

**Angles:** front_upper_crop, front_lower_crop

**ADAPTED 2026-08-27 from `standing_side_angle_stretch_back_pose` (full_back).** Same reasoning as the two warrior/side-lunge adaptations above: this is a wide-legged, extended-arm dynamic stretch that fits the exact pattern Hard Requirement 15 excludes from `full_back`. Relocated to a front-facing crop per Sunny's option-1 confirmation.

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, leggings, tights, shorts
**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; added 2026-08-28 during final validation, closing the same role-scoping gap Entries 1 & 3 identified — this wide-legged stance had only the unscoped exclusion until now)

**Params:**
- **stance:** wide-legged side-angle stance, one knee bent and loaded, the other leg straight
- **arm_position:** one arm reaching down along the front leg WITHOUT touching it (clarified 2026-08-27, Hard Requirement 3), the other extended straight up and overhead, forming a diagonal line
- **torso_angle:** facing camera or three-quarter turn — CHANGED from the original rear-view
- **head_orientation:** turned to the side, following the diagonal arm line — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** loaded onto the bent leg
- **recommended_framing:** front_upper_crop — relocated from `full_back` per Hard Requirement 15 — OR, when the bottom garment is the hero garment, front_lower_crop instead, so the full leg line is captured rather than cropped (Hard Requirement 16)
- **garment_visibility_priority:** front torso panel and the full diagonal body line read clearly — CHANGED from the original's back-panel focus; on `front_lower_crop`, extends to full leg-line and hem visibility

---

## standing_high_knee_ball_hold_lower_pose
**Label:** Standing High-Knee Raise with Ball at Ankle

**Priority:** 14

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom
- Categories: leggings, tights, shorts

**Params:**
- **stance:** standing on one leg, opposite knee driven high and forward, foot flexed
- **hand_placement:** one or both hands holding a small ball (equipment, not garment) at or near the raised ankle/shin
- **torso_angle:** profile to three-quarter, slight forward lean for balance
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** fully loaded onto the standing leg
- **recommended_framing:** front_lower_crop, hip-to-foot — the raised-knee line is the entire story
- **garment_visibility_priority:** shows the legging/short's stretch and hem behavior under full hip flexion

---

## tennis_skirt_forward_ready_pose
**Label:** Tennis Skirt — Forward-Bent Ready Stance

**Priority:** 13

**Angles:** full_front, front_upper_crop

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: skirts, tops, polos
**Avoid when:**
- Categories: shorts, leggings, tights

**Params:**
- **stance:** forward-bent ready stance, knees softly bent, feet staggered — narrow/staggered, skirt-safe per Hard Requirement 2
- **hand_placement:** both hands held low in front of the body as if gripping a racket in the ready position
- **torso_angle:** three-quarter, leaning forward
- **head_orientation:** level, focused forward — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct forward, alert
- **recommended_framing:** full_front or front_upper_crop
- **garment_visibility_priority:** skirt pleats and flare stay fully visible through the ready stance

---

## golf_skirt_address_pose
**Label:** Golf Skirt — Modest Address Hinge

**Priority:** 14

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: skirts, polos, tops
**Avoid when:**
- Categories: shorts, leggings

**Params:**
- **stance:** standing, feet shoulder-width apart, a subtle forward hinge from the hips — mild and modest, not a deep bend; skirt-safe per Hard Requirement 2
- **hand_placement:** both hands held low and together in front of the body, as if gripping a club
- **torso_angle:** facing forward, leaning down and forward slightly from the waist
- **head_orientation:** turned to the side and tilted downward toward the implied ball position — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** averted downward
- **recommended_framing:** full_front
- **garment_visibility_priority:** skirt pleats and waistband transition stay visible through the hinge

---

## kneeling_twist_hand_overhead_pose
**Label:** Kneeling Torso Twist, Hand Resting Overhead

**Priority:** 14

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, sports bras, leggings, shorts

**Params:**
- **stance:** kneeling with both knees grounded, torso twisted to one side
- **hand_placement:** one hand resting on top of the head (hair, not garment — fine); other hand hovering beside the opposite knee/hip, NOT touching either (updated 2026-08-27, Hard Requirement 3)
- **torso_angle:** three-quarter twist
- **head_orientation:** following the twist, turned to the side — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** averted to the side, focused
- **recommended_framing:** front_upper_crop
- **garment_visibility_priority:** shows torso-panel stretch and waistband transition under the twist

---

## standing_quad_stretch_knee_behind_pose
**Label:** Standing Quad Stretch, Knee Bent Behind

**Priority:** 15

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom
- Categories: leggings, tights, shorts, sports bras, tank tops

**Params:**
- **stance:** standing on one leg, opposite knee bent and raised behind toward the glute
- **hand_placement:** one hand reaching back to grip the raised ankle/foot (footwear, treated as equipment/gripping rather than garment contact — a standard, unambiguous stretch gesture); other arm relaxed or braced for balance, not touching the body
- **torso_angle:** side profile, slight forward lean for balance
- **head_orientation:** level or turned toward the raised leg — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or averted to the side
- **recommended_framing:** front_lower_crop, hip-to-foot — the bent-knee leg line is the focal detail
- **garment_visibility_priority:** shows the legging/short's stretch and hem behavior under full knee flexion

---

## foam_roller_seated_leg_extension_pose
**Label:** Seated Foam-Roller Leg Extension

**Priority:** 16

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, bike shorts, leggings, tights

**Params:**
- **stance:** seated on the floor, one leg extended straight over a foam roller positioned under the calf/hamstring, other leg bent
- **hand_placement:** both hands propped flat on the floor behind the body for support (floor, not garment — fine)
- **torso_angle:** upright, slight lean back over the supporting hands
- **head_orientation:** level or turned toward camera — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or downward toward the extended leg
- **recommended_framing:** front_lower_crop, hip-to-foot — the roller-and-leg line is the entire story
- **garment_visibility_priority:** shows legging/bike-short stretch and hem behavior over the extended leg

---

## foam_roller_reclined_leg_raise_pose
**Label:** Reclined Foam-Roller Leg Raise

**Priority:** 16

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, bike shorts, leggings, tights

**Params:**
- **stance:** reclined with the foam roller positioned under the back/hips, one leg raised and bent in the air, the other foot grounded
- **hand_placement:** one hand resting behind the head (hair, not garment); other arm braced on the floor for support
- **torso_angle:** reclined, chest open
- **head_orientation:** turned toward camera or resting back, level — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or upward, calm and controlled — a legitimate recovery/mobility position, not an editorial recline
- **recommended_framing:** front_lower_crop, hip-to-foot — the raised-leg line and roller placement are the focal detail
- **garment_visibility_priority:** shows the bra/tank underbust line and legging waistband under the recovery position

---

## overhead_triceps_extension_back_pose
**Label:** Overhead Triceps Extension, Back View

**Priority:** 17

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top
- Categories: sports bras, tank tops

**Conflicts with:** athletic_back_view_pose

**NOTE 2026-08-27:** kept on `full_back`, not adapted — a standing pose (weight settled, not a wide stance), the arm/equipment movement is contained rather than the wide-legged, full-body-extension pattern Hard Requirement 15 targets. Distinct from the three adapted entries.

**Params:**
- **stance:** standing, weight settled, back to camera
- **hand_placement:** one arm bent behind the head gripping a dumbbell (equipment) in an overhead triceps extension; other arm relaxed or bracing the working elbow, not touching garment
- **torso_angle:** facing away from camera (rear view)
- **head_orientation:** turned to a near-profile over the working-arm shoulder — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** averted to the side, focused
- **weight_distribution:** even, grounded
- **recommended_framing:** full_back — the raised-elbow silhouette and back-panel construction both need the rear view
- **garment_visibility_priority:** shows the bra's back strap crossing and armhole construction under the raised-arm hold

---

## standing_dumbbell_curl_bent_elbow_pose
**Label:** Standing Dumbbell Curl, Bent Elbow, Close Crop

**Priority:** 17

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: crop tops, tank tops, sports bras

**Params:**
- **stance:** standing straight, weight even, grounded
- **hand_placement:** one hand curling a dumbbell (equipment) up toward the shoulder, elbow bent and close to the torso; other hand relaxed at the side, NOT resting on the hip (updated 2026-08-27, Hard Requirement 3)
- **arm_position:** working arm fully flexed, forearm and bicep visibly engaged
- **torso_angle:** slight three-quarter turn, close crop
- **head_orientation:** turned toward the working side, focused — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or downward toward the curl
- **recommended_framing:** front_upper_crop, chest-to-waist
- **garment_visibility_priority:** shows underbust seam and sleeve/strap behavior under the flexed bicep, distinct from the forward-extended `straight_arm_equipment_press_pose`

---

## resistance_band_hip_height_pull_pose
**Label:** Resistance Band Pull, Hip-Height Anchor

**Priority:** 18

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, bike shorts, leggings

**Params:**
- **stance:** standing, weight settled, torso squared to slightly turned
- **hand_placement:** both hands gripping resistance-band handles (equipment) anchored behind the body at hip height, pulling taut
- **arm_position:** elbows bent and driven back, shoulder blades engaged
- **torso_angle:** frontal to slight three-quarter, chest open
- **head_orientation:** level or turned toward the working side — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or averted, focused
- **weight_distribution:** even, grounded
- **recommended_framing:** front_upper_crop, chest-to-waist
- **garment_visibility_priority:** shows waistband and underbust seam behavior under the hip-height pull, distinct from the chest-height `resistance_band_chest_pull_pose`

---

## standing_hamstring_curl_ball_squeeze_pose
**Label:** Standing Hamstring Curl, Ball Squeezed Behind Knee

**Priority:** 18

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom
- Categories: leggings, tights, bike shorts

**Params:**
- **stance:** standing on one leg, opposite knee bent and raised behind, foot flexed toward the glute
- **hand_placement:** a small ball (equipment) squeezed between the calf and glute of the raised leg; hands relaxed at the sides or lightly braced for balance, not touching the body
- **torso_angle:** profile to three-quarter, slight forward lean for balance
- **head_orientation:** level or turned toward the raised leg — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or averted to the side
- **weight_distribution:** fully loaded onto the standing leg
- **recommended_framing:** front_lower_crop, hip-to-foot — the bent-knee, ball-squeeze detail is the focal action
- **garment_visibility_priority:** shows legging stretch and hem behavior under the raised, flexed leg, distinct from the forward knee-drive of `standing_high_knee_ball_hold_lower_pose`

---

## lunge_resistance_band_pull_pose
**Label:** Wide Lunge with Frontal Resistance Band Pull

**Priority:** 19

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, bike shorts, leggings
**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; added 2026-08-28 during final validation, closing the same role-scoping gap Entries 1 & 3 identified — this wide lunge had only the unscoped exclusion until now)

**Params:**
- **stance:** wide lunge, front knee bent and loaded, back leg extended, band anchored low and to the side
- **hand_placement:** both hands gripping resistance-band handles (equipment), pulling frontally across the body
- **torso_angle:** three-quarter turn, facing into the pull
- **head_orientation:** turned toward the working side, focused — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or averted, engaged
- **weight_distribution:** loaded onto the front leg
- **recommended_framing:** full_front — the wide lunge and band line both need the whole body in frame. Confirmed eligible per Hard Requirement 15 — no evidenced `full_front` movement restriction
- **garment_visibility_priority:** shows waistband and leg-line stretch under the combined lunge-and-pull load

---

## standing_ball_shoulder_hold_pose
**Label:** Standing, Medicine Ball Held at Shoulder Height

**Priority:** 19

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: sports bras, tank tops, leggings

**Params:**
- **stance:** standing, weight settled, side profile to three-quarter turn
- **hand_placement:** both hands holding a small medicine ball (equipment) at shoulder height, close to the body
- **torso_angle:** three-quarter turn toward the holding side
- **head_orientation:** turned toward the ball or level, focused — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or downward toward the ball
- **recommended_framing:** front_upper_crop, chest-to-waist
- **garment_visibility_priority:** shows underbust seam and shoulder-strap construction under the raised hold, distinct from the hip-level `sumo_squat_prop_hold_pose`

---

## golf_glove_adjustment_pose
**Label:** Golf — Adjusting Glove, Standing

**Priority:** 20

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: polos, skirts, dresses

**Params:**
- **stance:** standing straight, weight even, grounded
- **hand_placement:** one hand adjusting a golf glove worn on the other hand, fingers pulling the glove snug — the glove itself is an accessory, not the hero garment
- **torso_angle:** three-quarter turn
- **head_orientation:** tilted down, following the hands — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** downward, focused on the glove
- **recommended_framing:** front_upper_crop, chest-to-waist — the glove-adjustment gesture is the focal detail
- **garment_visibility_priority:** keeps the polo/dress collar and placket legible while the hands stay low and centered; a narrow standing stance, skirt-safe with no wide leg-spread

---

## golf_dress_club_planted_stance_pose
**Label:** Golf Dress — Hand Open at the Side, Club Planted

**Priority:** 20

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: dresses, skirts, polos

**Params:**
- **stance:** standing straight, feet close together, grounded — narrow, skirt-safe
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one hand open at the side, NOT resting on the hip; other hand resting atop a club (equipment) planted upright on the ground beside the body
- **torso_angle:** three-quarter to side profile
- **head_orientation:** turned toward the camera or downrange, level — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or averted to the side
- **recommended_framing:** full_front — a narrow standing stance, skirt-safe, no wide leg-spread
- **garment_visibility_priority:** skirt/dress hem and waistband transition stay fully visible in the upright stance

---

## tennis_standing_stretch_racket_reach_pose
**Label:** Tennis — Standing Stretch, Racket Reaching Toward the Ground

**Priority:** 21

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: skirts, dresses, tops

**Params:**
- **stance:** standing on one leg, opposite leg raised straight behind in a held stretch — narrow base, skirt-safe
- **hand_placement:** one hand holding the racket (equipment), reaching down toward the ground; other arm extended for balance, not touching the body
- **torso_angle:** three-quarter, slight forward lean
- **head_orientation:** level or turned toward the racket-side arm — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or downward, focused
- **weight_distribution:** fully loaded onto the standing leg
- **recommended_framing:** full_front — the standing-leg line keeps this skirt-safe; a narrow base, not a wide stance
- **garment_visibility_priority:** skirt/dress flare and hem stay visible through the one-leg stretch

---

## tennis_racket_shoulder_rest_pose
**Label:** Tennis — Racket Resting on the Shoulder, Static

**Priority:** 21

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, accessory
- Categories: tank tops, tops, skirts, dresses

**Params:**
- **stance:** standing, weight even, grounded
- **hand_placement:** one hand raised, resting the racket (equipment) handle on the shoulder; other arm relaxed at the side, not touching the body
- **torso_angle:** frontal to slight three-quarter
- **head_orientation:** level or turned toward the racket side — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera, composed
- **recommended_framing:** front_upper_crop, chest-to-waist
- **garment_visibility_priority:** shows shoulder-strap and collar construction against the resting racket — fills the gap left by Female having no shoulder-carry equivalent to the Male library's racket/club holds

---

## tennis_ball_toss_racket_ready_pose
**Label:** Tennis — Ball Toss with Racket Ready

**Priority:** 22

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: skirts, dresses, tops

**Params:**
- **stance:** standing, forward-bent slightly, feet staggered
- **hand_placement:** one hand holding a tennis ball (equipment) raised at chest height, other hand holding the racket low and ready
- **torso_angle:** three-quarter, forward lean
- **head_orientation:** turned toward the ball hand, focused — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or downward toward the ball
- **recommended_framing:** front_upper_crop, chest-to-waist
- **garment_visibility_priority:** keeps the dress/skirt bodice and collar legible through the forward-bent ball-toss gesture

---

## tennis_dynamic_racket_overhead_carry_pose
**Label:** Tennis — Dynamic Stride with Racket Held Overhead

**Priority:** 22

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: skirts, dresses, tops

**Params:**
- **stance:** a held, grounded stride — both feet planted, front leg forward, never a walking gait
- **hand_placement:** one hand holding the racket (equipment) raised toward shoulder height; other arm driven back for balance, not touching the body
- **torso_angle:** three-quarter to profile, dynamic forward lean
- **head_orientation:** turned toward the direction of movement — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** forward, alert
- **weight_distribution:** dynamic, loaded onto the forward leg
- **recommended_framing:** full_front — the held stride and raised racket both need the whole body in frame. Confirmed eligible per Hard Requirement 15
- **garment_visibility_priority:** skirt/dress flare reads clearly under the dynamic lean

---

## warrior_lunge_arms_extended_front_pose
**Label:** Warrior-Stance Lunge, Arms Extended (Front View)

**Priority:** 23

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, shorts, leggings
**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches)

**Conflicts with:** athletic_standard_frontal_stance

**Params:**
- **stance:** wide lunge (front knee bent, back leg straight), both feet grounded and turned in a warrior-style stance
- **arm_position:** both arms extended straight out to the sides at shoulder height, forming a T-line across the frame
- **torso_angle:** facing camera, chest open
- **head_orientation:** turned to the side, following the line of one extended arm — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or averted along the extended arm
- **weight_distribution:** loaded onto the front bent leg
- **recommended_framing:** full_front — the full wingspan and wide stance need the whole body in frame; front-facing counterpart to the (now crop-adapted) `warrior_lunge_arms_extended_crop_pose`. Confirmed eligible per Hard Requirement 15 — no evidenced `full_front` movement restriction
- **garment_visibility_priority:** bra/tank underbust seam and leg-line both read clearly in the extended stance

---

## side_plank_extended_reach_pose
**Label:** Side Plank, Top Arm Extended

**Priority:** 23

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, leggings, shorts

**Params:**
- **stance:** side plank, supported on one forearm/hand and the outer edge of the lower foot, body forming a straight diagonal line
- **hand_placement:** top arm extended straight up toward the ceiling; supporting arm braced flat on the floor/mat (not garment)
- **torso_angle:** profile, laterally extended
- **head_orientation:** turned up toward the extended arm or level toward camera — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** upward or direct, focused
- **recommended_framing:** front_lower_crop, hip-to-foot — the diagonal body line and leg stack are the focal detail
- **garment_visibility_priority:** shows the legging/short's side-seam stretch and hem behavior under the extended plank line

---

## kneeling_leg_raise_back_pose
**Label:** Kneeling, Rear Leg Raised (Donkey-Kick Stretch)

**Priority:** 24

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom
- Categories: leggings, shorts, tights

**Params:**
- **stance:** kneeling on both knees, one leg lifted straight back and up behind the body
- **hand_placement:** both hands braced flat on the floor/mat for support (not garment)
- **torso_angle:** forward-leaning, level over the grounded knee
- **head_orientation:** level or turned toward the raised leg — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** down and forward, focused
- **weight_distribution:** supported through the grounded knee and both hands
- **recommended_framing:** front_lower_crop, hip-to-foot — the raised-leg line is the focal detail
- **garment_visibility_priority:** shows the legging/short's back-panel seam and stretch under the raised leg, distinct from the all-fours `bird_dog_kneeling_extension_pose`

---

## athletic_crouched_pose
**Label:** Crouched Action Stance

**Priority:** 15

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sweatshirts & hoodies, t-shirts, tank tops, shorts, sweatpants
- Fit: relaxed, regular, fitted
**Avoid when:**
- Categories: skirts, dresses

**Conflicts with:** athletic_standard_frontal_stance

**Params:**
- **stance:** crouched or kneeling stance with one knee raised high
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one hand hovering open beside the raised knee WITHOUT touching it, opposite hand relaxed at the side or interacting with footwear (gripping a shoe is fine, distinct from resting on garment fabric) — never resting on the hip
- **torso_angle:** three-quarter turn
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** weight distributed between the raised foot and the lowered knee or ground
- **leg_position:** one knee raised high, opposite leg extended backward or bent, touching the ground
- **pose_energy:** dynamic
- **occlusion_avoidance:** ensure side leg stripes and garment proportions remain visible during the crouch

---

## athletic_crouch_squat_stance
**Label:** Athletic Low Crouch and Squat Presentation

**Priority:** 16

**Angles:** full_front

**Applies when:**
- Roles: top, bottom
- Categories: tank tops, sports bras, shorts, leggings
- Fit: fitted, relaxed
**Avoid when:**
- Roles: outerwear, bottom
- Categories: trousers, coats, suits
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment like a sports bra matches; a client-confirmed rejection showed this exact wide crouch/hands-near-knees stance generated on a pleated tennis skirt)

**Params:**
- **stance:** deeply crouched squat stance with knees bent sharply
- **foot_position:** flat on the ground, shoulder-width apart
- **hand_placement:** SECOND UPDATE 2026-08-27 — the original "hand resting loosely on the knee, hand near the shin" no longer complies with the stricter Hard Requirement 3. Corrected: right hand hovering open beside the right knee WITHOUT touching it, left hand hovering near the left shin WITHOUT touching it
- **torso_angle:** three-quarter turn with rolled-forward shoulders
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **occlusion_avoidance:** arms and knees positioned to showcase crop top and short proportion

---

## athletic_rear_foot_elevation_stretch
**Label:** Kneeling Rear-Foot-Elevated Stretch

**Priority:** 17

**Angles:** front_lower_crop, full_front

**Applies when:**
- Roles: hero_garment, base_layer
- Categories: tank tops, sports bras, shorts, leggings, sweatpants
- Fit: fitted, relaxed
**Avoid when:**
- Categories: skirts, dresses

**Params:**
- **stance:** kneeling or lunging stance with one leg bent forward and the rear leg bent upward behind the body
- **hand_placement:** hands gripping the elevated foot/shoe (footwear, not garment) or braced on the floor — UPDATED 2026-08-27, no longer "resting on the raised knee" per Hard Requirement 3
- **torso_angle:** profile or three-quarter turn, leaning forward slightly
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** distributed between the front foot/knee and the rear supporting limb
- **recommended_framing:** front_lower_crop or full_front
- **garment_visibility_priority:** displays stretch-fit garments and leg lines during active movement

---

## athletic_seated_stretch_pose
**Label:** Seated Floor Stretch Presentation

**Priority:** 18

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, tops, shorts, leggings, t-shirts
- Fit: fitted, slim, relaxed
**Avoid when:**
- Categories: trousers, sweatpants, skirts, dresses

**Conflicts with:** athletic_standard_frontal_stance, athletic_crouched_pose

**Params:**
- **stance:** seated on the floor with asymmetric leg positioning for a stretch
- **hand_placement:** hands gripping the opposite foot/shoe (not garment) or extended forward on the floor
- **torso_angle:** three-quarter turn leaning forward toward the extended limb
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **leg_position:** one leg extended straight forward, the other bent at the knee
- **pose_energy:** dynamic
- **garment_visibility_priority:** fitted top and bottom waistlines remain legible while folded

---

## zip_jacket_lateral_stretch_pose
**Label:** Zip Jacket / Skirt Lateral Stretch Pose

**Priority:** 19

**Angles:** full_front

**Applies when:**
- Roles: outerwear, bottom, top
- Categories: sweatshirts & hoodies, jackets, skirts, tops
- Fit: fitted, slim, relaxed
**Avoid when:**
- Categories: sweatpants, trousers
- Fit: oversized

**Params:**
- **stance:** standing stance with a lateral upper-body bend
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one arm extended overhead, opposite hand open at the side, NOT resting on the hip or touching the waistband
- **torso_angle:** three-quarter turn, bending laterally
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** weight distributed across the lower body while the upper body actively stretches
- **garment_visibility_priority:** highlights collar details, zip closure, and clean hemline during the lateral stretch

---

## athleisure_dynamic_waist_open_pose — RENAMED 2026-08-27, hand placement corrected twice (hip, then thigh contact)
**Label:** Athleisure Dynamic Stance, Hands Open (formerly "Hands-on-Hips" — name retained for history)

**Priority:** 20

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, base_layer
- Categories: tops, sweatpants, leggings
- Fit: cropped, slim, relaxed
**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped — checked against the actual bottom garment, never satisfied just because a top/hero_garment matches; a client-confirmed rejection showed this same wide stance family generated on a pleated tennis skirt — see RCA Log Entry 3)

**Params:**
- **stance:** wide stance with one leg bent and extended to the side
- **hand_placement:** SECOND UPDATE 2026-08-27 — the first fix (hand in pocket or braced on the thigh) partially still relied on thigh contact, no longer compliant. Corrected: one hand in a pocket (still eligible per Hard Requirement 13), or both hands open at the sides without touching the hips or thighs — never resting on the hips/waist or the bent-knee thigh, in any angle
- **torso_angle:** three-quarter turn (right or left)
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** weight shifted dynamically to one side
- **garment_visibility_priority:** emphasize the crop-top and high-waist transition, exposing the midriff clearly

---

## athletic_standard_frontal_stance
**Label:** Standard Frontal Athletic Presentation Stance

**Priority:** 25

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, bottom, footwear
- Categories: t-shirts, tank tops, sports bras, shorts, leggings, tights, sweatpants, trousers
- Fit: regular, slim, relaxed
**Avoid when:**
- Roles: accessory

**Conflicts with:** athletic_dynamic_stride_pose, athletic_seated_stretch_pose, athletic_crouched_pose

**Params:**
- **stance:** feet shoulder-width apart, standing straight with even balance
- **hand_placement:** arms hanging naturally at the sides with relaxed fingers, or one hand carrying a bag/bottle (equipment)
- **torso_angle:** facing camera directly
- **weight_distribution:** weight distributed evenly across both legs
- **head_orientation:** vary across variants — level and facing forward on one, chin tilted subtly down or head turned slightly to one side on the other; never the identical level-forward head on both variants of the same shot
- **shoulder_alignment:** level
- **recommended_framing:** full_front — the fallback/baseline frontal shot, not the default register in this file
- **garment_visibility_priority:** full front silhouette of top and bottom garments fully visible

---

## athletic_back_view_pose
**Label:** Rear View Sport-Luxe Static Presentation

**Priority:** 26

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top, bottom, outerwear
- Categories: sweatshirts & hoodies, leggings, sweatpants, shorts, tops, t-shirts, jackets
- Fit: relaxed, fitted, skin-tight

**Conflicts with:** resistance_band_overhead_pull_back_pose, overhead_triceps_extension_back_pose

**UPDATED 2026-08-27:** this is now `full_back`'s PRIMARY register, not merely co-equal with dynamic options — per Hard Requirement 15, the three most wide-stance/high-movement `full_back` entries were adapted into crop poses, leaving this static entry and the two moderate standing entries (`resistance_band_overhead_pull_back_pose`, `overhead_triceps_extension_back_pose`) as `full_back`'s actual pool.

**Params:**
- **stance:** standing straight facing away from camera with a back view
- **hand_placement:** arms resting naturally at the sides, or holding an accessory (bottle, bag — equipment, not garment)
- **torso_angle:** facing away from camera (rear view)
- **weight_distribution:** even weight distribution across both legs
- **head_orientation:** turned to a near-profile or over-the-shoulder angle, varied across variants — favor this over a flat, un-turned back-of-head; a completely flat rear head on every variant is a confirmed client rejection
- **recommended_framing:** full_back — primary static register for this angle
- **garment_visibility_priority:** rear garment details, straps, back logos, and hem lines must be fully centered and unobstructed

---

## athleisure_full_body_neutral_stance
**Label:** Athleisure Full Body Neutral Stance

**Priority:** 27

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, base_layer
- Categories: t-shirts, tank tops, shorts, leggings
- Fit: relaxed, slim

**Params:**
- **stance:** standing straight with feet approximately shoulder-width apart, one foot slightly advanced
- **hand_placement:** both arms hanging naturally at the sides with fingers relaxed
- **head_orientation:** straight, facing forward — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **torso_angle:** facing camera
- **weight_distribution:** weight distributed evenly across both feet
- **garment_visibility_priority:** ensure full visibility of the top and bottom silhouette without occlusion

---

## sport_luxe_front_pocket_pose
**Label:** Sport-Luxe Front Pocket Casual Pose

**Priority:** 45

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, base_layer
- Categories: tops, trousers, sweatpants
- Fit: regular, slim, wide-leg

**Params:**
- **stance:** standing straight with feet slightly apart or shoulder-width
- **hand_placement:** both hands tucked into trouser/sweatpant pockets — only when a worn garment's `pockets` attribute reports real pockets; pocket is an eligible fallback per Hard Requirement 13, drawn from the shared fallback-gesture pool, not a default — should not be selected when any more athletic-register entry is eligible
- **torso_angle:** facing camera
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** weight distributed evenly across both feet
- **garment_visibility_priority:** emphasize clean lines of wide-leg trousers and tailored tops

---

## relaxed_pockets_stance
**Label:** Relaxed Hands-in-Pockets Stance

**Priority:** 46

**Angles:** full_front

**Applies when:**
- Roles: top, bottom
- Categories: tops, trousers, sweatpants
- Fit: relaxed, slim
**Avoid when:**
- Roles: hero_garment
- Categories: dresses, skirts

**Params:**
- **stance:** feet shoulder-width apart, even weight distribution
- **hand_placement:** both hands resting in trouser/sweatpant pockets — only when real pockets exist; pocket is an eligible fallback per Hard Requirement 13, drawn from the shared fallback-gesture pool, not a default
- **torso_angle:** three-quarter right turn
- **head_orientation:** turned slightly left with an averted gaze — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **occlusion_avoidance:** arms positioned to maintain visibility of the top hem and pocket structure

---

## accessory_grip_frontal_stance
**Label:** Accessory Grip Frontal Stance (Bag / Bottle Carry)

**Priority:** 35

**Angles:** full_front

**Applies when:**
- Roles: top, bottom, bag, footwear
- Categories: tops, shorts, leggings, bags, shoes
- Fit: slim, relaxed
**Avoid when:**
- Roles: dress
- Categories: dresses

**Params:**
- **stance:** standing straight, feet close together or shoulder-width apart
- **hand_placement:** right hand grasping a water bottle or bag strap (equipment) down by the side; left arm hanging loosely at the side
- **torso_angle:** facing camera
- **head_orientation:** draws from the Head-movement vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **occlusion_avoidance:** arms kept clear of the torso to ensure an unobstructed view of the tucked or untucked top-and-bottom intersection

---

## asymmetric_shift_duffel_stance
**Label:** Asymmetric Weight-Shift Duffel Bag Stance

**Priority:** 36

**Angles:** full_front

**Applies when:**
- Roles: top, bottom, bag, footwear
- Categories: tops, sweatpants, leggings, bags, shoes
- Fit: fitted, wide-leg
**Avoid when:**
- Roles: formal_wear
- Categories: suits, dresses

**Params:**
- **stance:** feet slightly apart, weight distributed primarily on the right leg
- **shoulder_alignment:** left raised, right dropped
- **hip_alignment:** shifted right
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — left arm relaxed at the side, NOT resting near the pocket/hip; right hand grips the duffel bag straps (equipment)
- **head_orientation:** turned slightly right and tilted downward — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both

---

## sport_luxe_skirt_side_turn
**Label:** Sport-Luxe Skirt Side Turn Pose

**Priority:** 37

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, layering_piece
- Categories: skirts, jackets, sweatshirts & hoodies
- Fit: slim, regular, a-line

**Params:**
- **stance:** standing straight with feet close together or slightly offset — narrow, skirt-safe
- **hand_placement:** UPDATED 2026-08-27 (Hard Requirement 3) — one hand open at the side, NOT resting on the hip; other arm hanging naturally or holding an accessory (equipment)
- **head_orientation:** turned to the side, looking back over the shoulder or averted — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **torso_angle:** three-quarter turn (left or right)
- **weight_distribution:** weight evenly distributed or slightly shifted on the legs
- **garment_visibility_priority:** showcase skirt pleats and jacket side-panel details

---

## seated_hands_clasped_relaxed_pose
**Label:** Seated, Hands Clasped Over a Bent Knee

**Priority:** 38

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, sweatshirts & hoodies
- Fit: oversized, relaxed

**Params:**
- **stance:** seated on the floor, knees bent and drawn up
- **hand_placement:** both hands clasped together over one bent knee — hands touch each other, not the garment
- **torso_angle:** three-quarter turn
- **head_orientation:** turned toward camera with a gentle tilt — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera, calm
- **weight_distribution:** seated balance, supported through the hips
- **recommended_framing:** full_front — the fallback/relaxed register for oversized loungewear-adjacent tops
- **garment_visibility_priority:** shows oversized drape and hem length while seated
