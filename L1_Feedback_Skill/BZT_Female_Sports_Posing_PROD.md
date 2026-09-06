# Pose Library — BZT Female Sports

Posing rules for BZT Female Sports imagery — governs stance, hand placement, head/gaze, and framing for every generated shot.

---

## Global Rules

These are client-agnostic generation-quality principles. They are not specific to BZT or to this client's garments, and any similar pose-library job can reuse them as-is.

**Rule:** A dynamic pose must read as deliberate and controlled, never a stumble, wobble, or accident; a static pose keeps both feet flat and grounded.
**Why:** An uncontrolled-looking pose reads as an unintentional candid rather than a deliberate athletic or fashion pose, regardless of shot type.

**Rule:** Follow each entry's own alignment call — lean fully into an asymmetric stance (a hinge, lunge, or shift) when the entry's Params specify one, and render a level/even stance as clean and confident, never stiff or mannequin-like.
**Why:** Forcing an asymmetric pose back toward a level, centered stance flattens the pose's intended energy; a level stance is a valid, different register, not a watered-down version of a dynamic one.

**Rule:** A hand must never touch the garment the model is wearing, in any shot, in any angle — not gripping, not pinching, not bunching, and not simply resting on it either. This includes a garment-covered hip, thigh, knee, or shin, and it covers a deliberate "styling" grip (a hem-pinch or fabric-hold) exactly the same as an incidental rest. A hand may rest on bare skin, hang free without touching the body, hold a pocket **only when the specific garment actually has a real pocket in that location**, grip equipment (not garment), or clasp the other hand.
**Why (pocket condition):** Offering "pocket" as a fallback without checking the garment actually has one forces a choice between an invented pocket that doesn't exist on the product or an awkward hand reaching toward nothing. Gating it on the garment's real construction removes both failure modes at the source.
**Why:** Hand-on-garment contact is one of the most heavily and consistently rejected patterns in the evidence behind this framework, with no exception found across any angle.

**Rule:** Never write a hand or arm description that names the hip, thigh, or waist as the hand's spatial anchor and then negates contact (e.g. "at hip height, not touching the hip"). Describe only where the hand actually ends up — extended away from the torso, raised to chest height, hanging at arm's length, gripping equipment — without using the hip or thigh as the reference point, even to deny contact.
**Why:** Anchoring language paired with a negation is measurably weaker at generation time than a description that never mentions the hip or thigh at all — the anchor word still conceptually places the hand there even while the sentence denies contact. This pattern produced real, repeated hand-on-hip/thigh contact defects even in text that already read as compliant.

**Rule:** Never describe a raised, extended, or resting free hand with "fingers splayed," "fingers spread" (with or without a softening qualifier like "loosely" — the qualifier does not neutralize the trigger phrase), or "open," and never specify or imply that the palm faces the camera or forward. Describe a free hand as relaxed, with fingers loosely together or curled (not spread, not open), palm facing inward toward the body or downward — never toward the camera.
**Why:** This combination reliably generates a stiff, flat "stop sign" hand rather than a relaxed athletic counterbalance. It appeared specifically as the unintended side effect of an earlier fix to hip-anchored hand language, so both the trigger phrasing and its likely origin (a rewritten hand-placement description) need to be guarded against together.

**Rule:** A hand must never rest on the hip or waist, in any pose, in any angle, with no exception.
**Why:** This is the single most heavily and consistently evidenced rejection pattern behind this framework, found with no exception across every angle — it is treated as an absolute, not a style preference.

**Rule:** Expression must read as present, alive, and naturally engaged, with energy matched to the pose — never blank, vacant, or frozen — and must vary naturally across the two generated variants of a shot.
**Why:** A flat or lost expression breaks the "real athlete in the moment" read the whole pose depends on, regardless of how correct the body mechanics are.

**Rule:** Head orientation and gaze selection, variety across the two generated variants, and the back-of-head fallback rule are governed in full in the Head Movements section — see that section for the complete rule.
**Why:** Head/gaze is the primary source of visible variety between two otherwise-similar generated variants of the same shot, and needs to be resolvable from that one section alone when only Head Movements is passed as context.

**Rule:** Every loaded item (equipment, a bag, a bottle) must be carried, not dropped, in the selected pose — this requirement outranks Priority. The full rule, including its Why, is stated in the Equipment & Props section.
**Why:** Priority ordering exists to pick between otherwise-equivalent options, not to justify dropping a loaded item the job actually requires.

**Rule:** `Priority` on every entry in this file sets a probabilistic selection weight across a batch, not a deterministic pick order — apply it using rank-based tiers, not a fixed table, because the number of eligible entries for a given angle varies (this file's own pools range from 2 to 24 depending on angle). For a given job's actual eligible pool (after `Applies when`/`Avoid when` filtering for that angle and garment), rank the eligible entries by Priority, lowest first, and distribute selection likelihood across a batch of similar jobs roughly as: the top third of the ranked pool (rounded up, minimum 1 entry) collectively takes roughly 50-60% of selections; the middle third collectively takes roughly 25-35%; the bottom third collectively takes the remainder. Within each third, no single entry should exceed roughly 25% of all selections on its own, and no eligible entry should fall below a real, visible floor (roughly 2-3%) — an entry that is eligible but never actually gets picked across a batch is a defect, the same class of problem as one entry dominating. Recompute the tiers from whatever the actual eligible pool is for that job; do not hardcode which named entries fall in which tier, since entries get added, retired, or re-prioritized over time.
**Why:** A fixed percentage table (e.g. "Priority 1 = 40%, Priority 2 = 30%") only works for a pool of exactly four eligible entries — most angles in this file have far more, and Priority numbers are not sequential per angle, so no fixed table can apply uniformly. Rank-based tiers scale automatically to whatever pool size actually exists for a job, and don't need to be manually rebalanced every time an entry is added or removed. This rule is reinforced separately in the generation system's own selection instructions; stating it here as well means the guidance holds even when this file is read on its own, without that other context.

**Rule:** `Avoid when` and `Conflicts with` fields are binding, not advisory. Never override an `Avoid when` match to win on Priority, and never drop an item or detail in one generated variant that another variant of the same shot shows.
**Why:** These fields exist to encode hard eligibility and consistency constraints; treating them as optional guidance defeats their purpose and reintroduces the defects they were written to prevent.

**Rule:** No exaggerated, theatrical, or physically impossible pose is eligible — including any backward spinal arch or backbend — without an explicit QC sign-off flag.
**Why:** These read as exaggerated fashion or editorial poses rather than the grounded, achievable athletic register this framework targets, and are not supported by the reference evidence behind this file.

**Rule:** Keep the model's reference hairstyle exactly as shown — never restyle it into a more elaborate or editorial look. Avoid glamorous posing or theatrical flourish generally.
**Why:** The house register is a grounded, natural athletic presentation, not a fashion-editorial shoot; overstyled hair or theatrical posing works against that read.

**Rule:** Every pose must read as one single, coherent, natural human action — stance, hand/arm position, torso angle, and head/gaze together, not individually-valid body parts assembled from unrelated poses.
**Why:** This is a real, standing rejection reason distinct from any single mechanism like hand placement or clothing type. A pose can satisfy every other rule in this framework and still fail this one if the overall gesture reads as disjointed or borrowed — for example, a clenched or raised fist during a counterbalance reading as an unrelated boxing-guard gesture, or a hand tucked behind the lower back reading as a borrowed gesture rather than a natural counter-arm. This is a qualitative standard with no numeric threshold, but it is still a hard requirement: a pose that fails it needs its Params rewritten, not shipped on a technicality.

---

## Equipment & Props

**Equipment & prop vocabulary** (from the BZT Female Sports reference set), in rough order of frequency:
1. One or both hands cradling a small pilates/med ball at the hip (equipment against the body, not a bare hand on garment — fine) or held to one side.
2. Both hands clasped together at chest height (prayer-hands squat).
3. One hand hovering near a bent knee or the front thigh during a lunge or crouch, not touching it.
4. One hand gripping a racket.
5. One arm extended overhead in a lateral reach/stretch.
6. Both hands gripping resistance-band handles at chest height.
7. One hand holding a water bottle low at the side.
8. One hand carrying a bag by the handle or on one shoulder.
9. A kneeling hand braced on the floor/mat (not garment) with the opposite arm or leg extended (bird-dog).

A relaxed hand-at-the-side, a pocketed hand, or hands clasped together is the fallback register — never substitute it for a pose whose own Params call for one of the equipment/training interactions above.

**Rule:** Every loaded item (equipment, a bag, a bottle) must be given an explicit placement and carried in the selected pose — this requirement outranks Priority. An entry that leaves hands empty must never be selected over an eligible entry that carries the item, even if the empty-handed entry has a better (lower) Priority number.
**Why:** Priority ordering exists to pick between otherwise-equivalent options, not to justify dropping a loaded item the job actually requires; letting Priority override this produces a real, visible missing-equipment defect.

**Note:** The garment-contact ban — a hand may grip or hold equipment against the body, but the garment itself may never be touched by a hand — is defined in full in Global Rules; see that section for the complete rule.

---

## Head Movements

**Rule:** Head orientation and gaze must follow each entry's own stated options, never defaulting to one repeated position. Where an entry lists more than one option, the two generated variants of the same shot must land on visibly different ones, and a flat, un-turned back-of-head must never appear on every variant of a rear-facing shot.
**Why:** Head/gaze is the primary source of visible variety between two otherwise-similar generated variants of the same shot. Repeating an identical head position on both variants, or defaulting every rear shot to a flat back-of-head, reads as a lack of real variation and is a confirmed rejection pattern.

**Head-movement vocabulary** (from the BZT reference set, gender-agnostic — shared verbatim with the Male file). On front-facing shots, draw the actual head/gaze call from:
1. Direct-level frontal, eyes straight at camera.
2. Level, head/eyes turned to one side without dropping (a pure side-glance).
3. Turned to one side and tilted down together, a combined glance.
4. Chin dropped straight down toward the chest, eyes lowered, no side turn — discouraged, lower preference.
5. Turned toward profile with the chin very slightly lifted.
6. Head stays level and forward, only the gaze/eyes cast downward — discouraged, lower preference.

On rear-facing shots:
1. A flat, straight, un-turned back-of-head — fallback only, must never dominate across variants.
2. A near-profile turn with the ear visible — the primary recommended back-view movement.
3. Turned to one side and tilted down, tracking an implied piece of equipment or the ground.

---

## Non-Negotiable Rules

Rules specific to BZT Female Sports that are not Global, Equipment & Props, or Head Movements content. Angle vocabulary used throughout this file: `full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`. The BZT Female Sports house look is controlled athletic energy, same as BZT Male Sports — the reference set is dominated by real training positions (squats, lunges, crouches, kneeling stretches, overhead reaches, equipment presses), not standing-still variety. `full_front` and `full_back` are the static-leaning angles; every crop angle is built around a held, controlled action position. Static, level stands remain a valid fallback register, not the default.

### Prohibited / Must-Not-Happen conditions

**Rule:** A walking or mid-stride gait — one foot lifted and swinging as if caught mid-step — is prohibited completely, on every shot type, with no exception.
**Why:** A walking gait reads as an unintentional lifestyle candid, not a controlled athletic or fashion pose, and is rejected on every angle with no exception found. Genuine athletic motion — a jog/run stride, a lunge, a stretch — is not a walking gait and remains in scope.

**Rule:** Footwear must always match the implied activity (e.g. running shoes for a running pose, court shoes for a racket sport, training shoes for gym work) whenever feet are in frame. Bare feet are never acceptable in a full-body or lower-body shot.
**Why:** Mismatched or absent footwear breaks the athletic context the pose is built around, and bare feet is one of the most consistently rejected patterns in the evidence behind this framework.

**Rule:** Any wide-legged, open-stance, or straddle pose (a wide lunge, warrior stance, wide side-lunge, hands-on-hips wide stance, deep crouch, or similar) is a hard error when the hero garment worn is a skirt or dress, with no exception. This exclusion is scoped to the bottom garment actually worn — never satisfied just because a top/hero_garment happens to match a wide-stance entry's other eligibility criteria. When the hero garment is a skirt or dress, only a narrow, staggered, or standing stance is ever acceptable, regardless of what else is eligible by category.
**Why:** A wide-legged/straddle pose generated on a pleated skirt was a confirmed, explicit client rejection. A matching top must never let an unexamined skirt or dress bottom through a wide-stance entry's eligibility check.

**Rule:** The running/sprint-stride mechanic must never be forward-facing and must never render as an airborne "flying" pose; it must never appear on `full_front` or `full_back`.
**Why:** A forward-facing running stride is rejected in every angle in the underlying evidence, while a diagonal/sideways stride is explicitly accepted on crop shots only.

**Rule:** `full_back` must never carry a wide-stance, high-movement dynamic pose — a hard boundary, not a soft lean.
**Why:** The evidence behind this framework rejects wide-stance, high-movement `full_back` poses repeatedly with no exception, while multiple full-body, front-facing dynamic poses were explicitly approved on movement grounds alone.

**Rule:** A hand in a pocket (or any single fallback gesture) must never be the first-listed, most frequent, or default choice, and must never repeat identically across both variants of a shot.
**Why:** Treating any single fallback gesture (pocket included) as the default produces the same over-saturation problem that hand-on-hip caused before it was banned — a fallback needs to stay a fallback, not become the new default.

**Rule:** `dynamic_torso_twist_hand_raised_pose` is retired and must never be selected. Its entire premise was a raised, open-palm "blocking/reaching" hand; real generation output confirmed this reads as an unnatural, theatrical stop/reaching gesture, not an athletic movement, appearing at high frequency on `front_upper_crop`.
**Why:** Retired outright with no fixed replacement — the same treatment `athletic_akimbo_power_pose` received in the Male file for an unfixable premise. No Male equivalent of this pose ever existed. Left in the Entry Library for record only.

### Required/Allowed conditions

**Rule:** `full_front`, `full_back` keep feet in frame; `front_lower_crop` keeps feet/legs in frame; `front_upper_crop` is waist-up by definition — never force feet into it, and never crop a full-body entry's stance down to lose the detail it was written for. On any crop angle, whenever a pose's Params call for a raised, extended, or driven arm, position the subject with enough lateral margin that the hand stays completely inside the frame.
**Why:** Each angle has a fixed coverage contract; feet or a driven hand exiting the frame breaks that contract regardless of how correct the pose itself is.

**Rule:** Whenever a job's hero garment is a bottom-category item (shorts, leggings, tights, sweatpants), it must never be routed to a pose whose only eligible `Angles` value is `front_upper_crop` — select an entry that also lists `front_lower_crop` (or `full_front`/`full_back`) among its Angles, or skip a `front_upper_crop`-only pose for that job. The reverse applies symmetrically: a top-category hero garment should not be routed to a `front_lower_crop`-only entry.
**Why:** `front_upper_crop` crops at the waistband/upper thigh and structurally cannot show a bottom garment's hem or leg line; `front_lower_crop` symmetrically only shows the bottom edge of a top, not its full construction. Entries whose stance genuinely doesn't translate to a lower-crop framing (an overhead reach, a seated curl) are left `front_upper_crop`-only on the assumption their hero garment is normally a top, not a bottom.

**Rule:** The running/sprint-stride mechanic (`athletic_dynamic_stride_pose` and its tighter-crop sibling `sprint_arm_drive_crop_pose`) is eligible on `front_upper_crop`/`front_lower_crop` only, and only in its diagonal/sideways form. Its arm, hand, and head/gaze description is locked to the approved reference mechanic: reciprocal arm drive with the trailing-leg-side arm forward and up (elbow near a right angle, hand at chest height, fingers relaxed and loosely curled together, palm inward/downward, never a clenched fist), the other arm mirrored back and down; head turned to a three-quarter/profile angle in the direction of movement with a level chin and the face fully visible; gaze directed into the distance in the direction of movement. No separate Female-only running reference exists — this mechanic mirrors the Male file's `dynamic_sprint_stride_pose` exactly.
**Why:** The arm/hand/head mechanic is locked to the one reference image explicitly confirmed acceptable, to prevent drift back into a forward-facing or splayed-finger/palm-forward defect.

**Rule:** The running-stride entries are one eligible option among many, not a default — target roughly one selection in ten eligible jobs. Their Priority is set toward the bottom of the eligible pool accordingly.
**Why:** Real output showed these entries selected in roughly 19 of 20 eligible jobs even though neither held a top Priority value. Priority demotion is applied as a mitigation, not a guaranteed fix — this is a stronger sign that the true cause of over-selection may sit in the selection/weighting layer outside this file; if over-selection persists after this change, that layer needs the fix, not another content edit.

**Rule:** `full_front` carries no wide-stance restriction — dynamic poses are fully eligible there; its lean toward static entries is a soft default from the original reference set, not a hard ban. `full_back` carries a purely static/silhouette register, alongside one contained standing entry (`resistance_band_overhead_pull_back_pose`) that doesn't match the wide-stance pattern the ban above targets.
**Why:** Multiple full-body, front-facing dynamic poses were explicitly approved on movement grounds alone, unlike `full_back`.

**Rule:** `front_upper_crop` carries the dynamic register almost exclusively, and `front_lower_crop` is where kneeling/floor-based leg work lives — both need real movement, not a static hold. `full_front`'s dynamic entries are fully eligible but remain secondary to its static/neutral primary register — selected occasionally, not as the default landing spot whenever a dynamic variant is wanted.
**Why:** This matches the reference set's actual distribution and keeps dynamic `full_front` entries from becoming an over-selected substitute for the static register that should remain the majority outcome there.

**Rule:** The fallback-gesture pool for this file rotates between a pocketed hand (only when the garment has a real pocket), a relaxed-at-the-side hand, an equipment carry, and clasped hands. When the garment has no real pocket, the pocketed-hand option drops out of the pool entirely for that job — never substituted with an invented pocket or an approximated reach toward where one would be. A relaxed hand at the side is always available regardless of garment or equipment, and is the correct default whenever nothing else in the pool applies.
**Why:** Rotating among several fallback gestures, rather than one, prevents any single fallback from becoming the new dominant gesture in place of the banned hip-rest.

---

## Entry Library


### resistance_band_chest_pull_pose
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

### sprint_arm_drive_crop_pose
**Label:** Sprint Mid-Stride Arm Drive (Upper Crop, Tight)

**Priority:** 21 — set toward the bottom of its eligible pool, same reasoning and target (roughly 1 in 10, not the default) as `athletic_dynamic_stride_pose` below.

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, accessory
- Categories: t-shirts, tank tops, sweatshirts & hoodies, sleeves, gloves

**Avoid when:**
- Categories: dresses, skirts, trousers

**The tightest-crop adaptation of the approved running reference** (see `athletic_dynamic_stride_pose` and the running-mechanic rule in Non-Negotiable Rules above). Eligible on `front_upper_crop` only, framed so the head is never cropped out — same arm/torso mechanic as the reference, cropped a little tighter than the primary entry so the legs run mostly out of frame.

**Params:**
- **stance:** captured mid-sprint, grounded and controlled — never an airborne leap with both feet off the ground at once; torso leaning forward into the drive
- **arm_position:** reciprocal arm drive — the arm on the same side as the trailing leg drives forward and up, elbow bent to roughly a right angle, hand at chest height, fingers relaxed and loosely curled together (a soft, natural running hand — never spread, splayed, or an open flat palm, never a clenched fist), palm facing inward/downward, never toward the camera; the other arm drives back and down at a mirrored bend, equally relaxed, never resting on or touching the hip/garment
- **torso_angle:** three-quarter turn at roughly 45 degrees, moving diagonally toward the camera or sideways — never angled or moving away from the camera
- **head_orientation:** turned to a three-quarter/profile angle in the direction of movement, chin level (never tilted down), face fully visible, looking ahead — not at the camera
- **gaze_direction:** directed off to the side into the distance, in the direction of movement — not down, not straight at the lens — focused, high intensity
- **weight_distribution:** dynamic, forward-loaded, always grounded
- **recommended_framing:** front_upper_crop, top of head to roughly waist — the head is a hard floor, never cropped out
- **garment_visibility_priority:** shows fabric behavior and sleeve/armhole clearance under real motion

---

### bird_dog_kneeling_extension_pose
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

### kneeling_side_stretch_hand_thigh_pose
**Label:** Kneeling Side Stretch

**Priority:** 10

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom
- Categories: shorts, leggings, sweatpants

**Params:**
- **stance:** one knee grounded, opposite leg bent with the foot planted, torso leaning back and to the side over the grounded knee
- **hand_placement:** one hand extended down along the front thigh line, fingers relaxed and loosely together, hovering just above the leg without touching it; other arm raised or braced behind for support (out of a tight crop)
- **torso_angle:** profile, arched slightly back into the stretch
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** supported through the grounded knee and the planted foot
- **recommended_framing:** front_lower_crop, hip-to-knee — a tight, close crop on the stretch line
- **garment_visibility_priority:** shows the short/legging's waistband and side-seam drape under the side-bend

---

### athletic_dynamic_stride_pose
**Label:** Dynamic Running Stride Athletic Presentation

**Priority:** 23 — set toward the bottom of its eligible pool. Real output showed this entry (and its tighter-crop sibling `sprint_arm_drive_crop_pose`) selected in roughly 19 of 20 SKUs despite neither holding a top-priority value — a real possibility the true cause is in the selection layer, not this file. Target roughly 1 selection in 10 eligible jobs, not the default.

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, sports bras, shorts, leggings
- Fit: fitted, relaxed, slim

**Avoid when:**
- Roles: bottom, footwear
- Categories: trousers, sweatpants, skirts

**Conflicts with:** athletic_standard_frontal_stance, athletic_seated_stretch_pose

**The sole approved running-stride mechanic in this file, locked to the running-mechanic rule in Non-Negotiable Rules above.** No separate Female reference exists — this mirrors the Male file's `dynamic_sprint_stride_pose` exactly. Eligible on `front_upper_crop`/`front_lower_crop` only, never `full_front`/`full_back`; only the diagonal/sideways mechanic is acceptable, never forward-facing, never a flying pose.

**Params:**
- **stance:** full mid-stride sprint drive, grounded and controlled — never an airborne leap with both feet off the ground at once. Lead leg driven forward and up with a sharp high-knee lift, trail leg extended back and bent, the trailing foot's toe/ball still in contact with or just leaving the ground
- **hand_placement:** reciprocal arm drive — the arm on the same side as the trailing leg drives forward and up, elbow bent to roughly a right angle, hand at chest height, fingers relaxed and loosely curled together (a soft, natural running hand — never spread, splayed, or an open flat palm, never a clenched fist), palm facing inward/downward, never toward the camera; the other arm drives back and down at a mirrored bend, equally relaxed, never resting on or touching the hip/garment
- **torso_angle:** three-quarter turn at roughly 45 degrees, moving diagonally toward the camera or sideways across the frame — never angled or moving away from the camera
- **weight_distribution:** dynamic, loaded onto the driving leg mid-transfer, always grounded
- **head_orientation:** turned to a three-quarter/profile angle in the direction of movement, chin level (never tilted down), face fully visible, looking ahead — not at the camera
- **gaze_direction:** directed off to the side into the distance, in the direction of movement — not down, not straight at the lens — focused, high intensity
- **pose_energy:** dynamic
- **recommended_framing:** front_upper_crop or front_lower_crop — top of head to roughly mid-thigh, face always fully in frame. Never `full_front` or `full_back`
- **footwear:** when feet are in frame, the model always wears proper running shoes matched to the activity — never barefoot
- **occlusion_avoidance:** arms positioned to maintain a clear view of torso branding and garment lines during motion

---

### standing_one_leg_balance_reach_pose
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

### resistance_band_overhead_pull_back_pose
**Label:** Resistance Band Overhead Pull, Symmetric (Back View)

**Priority:** 13

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, leggings, tights, shorts

**Conflicts with:** athletic_back_view_pose

**Locked to a confirmed-acceptable reference — both hands together, straight overhead, no lateral lean.** Two rejected variants of this same equipment interaction exist and must not be reproduced: (1) an asymmetric single-arm diagonal pull with the torso leaning/twisting into the reach — never do this, both arms move and load together, symmetrically; (2) the band/rope rendered as two separate lines running down to two separate floor anchor points, forming a wide V/W shape — the band's equipment description must keep both handles gripped together at a single point overhead, not spread to two independent anchors.

**Params:**
- **stance:** standing, feet grounded, stable and symmetric — weight even on both feet, no lean to either side
- **hand_placement:** both hands gripping the resistance-band handles together, side by side, pulling straight overhead — never one arm at a time, never spread to two separate anchor points
- **torso_angle:** facing away from camera (rear view), upright and centered — no lateral bend, no twist toward either side
- **head_orientation:** level, or turned gently to one side — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** even, grounded, symmetric
- **recommended_framing:** full_back
- **garment_visibility_priority:** back-panel seams and strap crossings read clearly under the symmetric overhead extension

---

### rear_prop_hold_back_pose
**Label:** Rear-View Prop Held Behind the Back

**Priority:** 15

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top, bottom, accessory
- Categories: tank tops, sports bras, shorts, leggings, tights

**Ported from the Male file's `athletic_prop_carry_pose` (its rear-view variant) — the mechanic is fully gender-neutral. A contained, standing hold, not the wide-stance pattern the `full_back` ban excludes.**

**Params:**
- **stance:** standing straight, weight settled, squared away from the camera
- **hand_placement:** one hand holding a small prop (ball or equivalent equipment) behind the back at waist height, not touching garment; other arm relaxed at the side
- **torso_angle:** facing away from camera, squared
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **weight_distribution:** static, centered balance
- **recommended_framing:** full_back
- **garment_visibility_priority:** ensures the prop does not fully occlude back branding; back panel and strap construction stay legible

---

### backpack_carry_rear_three_quarter_pose
**Label:** Backpack Carry, Rear Three-Quarter View

**Priority:** 18

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top, outerwear, bag
- Categories: sports bras, tank tops, sweatshirts & hoodies, jackets, bags

**Ported from the Male file's equivalent entry — the mechanic is fully gender-neutral.**

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

### jump_rope_side_profile_pose
**Label:** Jump Rope, Side Profile Mid-Motion

**Priority:** 24

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top
- Categories: sports bras, tank tops, sweatshirts & hoodies
- Fit: fitted, slim, relaxed

**Ported from the Male file's equivalent entry — the mechanic is fully gender-neutral.**

**Params:**
- **stance:** standing, weight settled on the balls of both feet, side profile to the camera
- **hand_placement:** both hands holding jump-rope handles (equipment) low at the hips, rope trailing to the side, a held moment in the motion rather than mid-jump — the handles, not the hands directly, are near the hips
- **torso_angle:** profile, upright and grounded
- **head_orientation:** level or turned slightly toward camera — vary the exact degree/side across the two generated variants
- **gaze_direction:** forward, focused
- **weight_distribution:** even, both feet grounded
- **recommended_framing:** full_back — the profile stance reads equally well from a rear three-quarter angle; a contained, standing pose, not the wide-stance pattern the `full_back` ban excludes
- **garment_visibility_priority:** shows the garment's side-seam and hem behavior under the rope's swinging motion

---

### boxing_guard_crouch_pose
**Label:** Boxing Guard Crouch, Fists Raised

**Priority:** 14

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, sports bras, leggings, tights, shorts

**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped to the bottom garment actually worn — never satisfied merely because a top/hero_garment like a tank top or sports bra matches; a staggered, wide-footed crouch stance is exactly the pattern the skirt/dress wide-stance ban targets)

**Params:**
- **stance:** athletic boxing stance, knees bent, feet staggered, weight low and balanced
- **hand_placement:** both fists raised near the chin/chest in a guard position, not touching the chest garment, elbows in
- **torso_angle:** three-quarter turn, shoulders squared to the lead side
- **head_orientation:** level, chin slightly tucked, focused forward — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or forward, intense and alert
- **weight_distribution:** low, evenly balanced between the staggered feet
- **recommended_framing:** front_upper_crop, chest-to-waist — or, when leggings/tights/shorts are the hero garment, front_lower_crop instead, so the staggered-stance leg line and hem are fully captured
- **garment_visibility_priority:** shows the sports bra/tank underbust line and shoulder mobility under the guard position; on `front_lower_crop`, extends to full leg-line and hem visibility

---

### dynamic_torso_twist_hand_raised_pose — RETIRED, DO NOT SELECT

**Angles:** none — retired

**RETIRED — not eligible for selection, not patched.** Its entire premise was a raised, open-palm "blocking/reaching" hand — real generation output confirmed this reads as an unnatural, theatrical stop/reaching gesture, not an athletic movement, appearing at high frequency on `front_upper_crop`. Retired outright with no fixed replacement — the same treatment `athletic_akimbo_power_pose` received in the Male file for an unfixable hip-hands premise. No Male equivalent of this pose ever existed. Left in the file for record only.

---

### standing_side_angle_stretch_crop_pose
**Label:** Standing Side-Angle Stretch (Crop Adaptation)

**Priority:** 14

**Angles:** front_upper_crop, front_lower_crop

**A front-facing crop adaptation of the same wide-legged, extended-arm dynamic stretch that fits the pattern the `full_back` wide-stance ban excludes** — the same treatment as the two warrior/side-lunge adaptations above.

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: sports bras, tank tops, leggings, tights, shorts

**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped to the bottom garment actually worn — never satisfied merely because a top/hero_garment matches)

**Params:**
- **stance:** wide-legged side-angle stance, one knee bent and loaded, the other leg straight
- **arm_position:** one arm reaching down along the front leg without touching it, the other extended straight up and overhead, forming a diagonal line
- **torso_angle:** facing camera or three-quarter turn
- **head_orientation:** turned to the side, following the diagonal arm line — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** loaded onto the bent leg
- **recommended_framing:** front_upper_crop — or, when the bottom garment is the hero garment, front_lower_crop instead, so the full leg line is captured rather than cropped
- **garment_visibility_priority:** front torso panel and the full diagonal body line read clearly; on `front_lower_crop`, extends to full leg-line and hem visibility

---

### standing_high_knee_ball_hold_lower_pose
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
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** fully loaded onto the standing leg
- **recommended_framing:** front_lower_crop, hip-to-foot — the raised-knee line is the entire story
- **garment_visibility_priority:** shows the legging/short's stretch and hem behavior under full hip flexion

---

### tennis_skirt_forward_ready_pose
**Label:** Tennis Skirt — Forward-Bent Ready Stance

**Priority:** 13

**Angles:** full_front, front_upper_crop

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: skirts, tops, polos

**Avoid when:**
- Categories: shorts, leggings, tights

**Params:**
- **stance:** forward-bent ready stance, knees softly bent, feet staggered — narrow/staggered, skirt-safe
- **hand_placement:** both hands held low in front of the body as if gripping a racket in the ready position
- **torso_angle:** three-quarter, leaning forward
- **head_orientation:** level, focused forward — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct forward, alert
- **recommended_framing:** full_front or front_upper_crop
- **garment_visibility_priority:** skirt pleats and flare stay fully visible through the ready stance

---

### golf_skirt_address_pose
**Label:** Golf Skirt — Modest Address Hinge

**Priority:** 14

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: skirts, polos, tops

**Avoid when:**
- Categories: shorts, leggings

**Params:**
- **stance:** standing, feet shoulder-width apart, a subtle forward hinge from the hips — mild and modest, not a deep bend; skirt-safe
- **hand_placement:** both hands held low and together in front of the body, as if gripping a club
- **torso_angle:** facing forward, leaning down and forward slightly from the waist
- **head_orientation:** turned to the side and tilted downward toward the implied ball position — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** averted downward
- **recommended_framing:** full_front
- **garment_visibility_priority:** skirt pleats and waistband transition stay visible through the hinge

---

### kneeling_twist_hand_overhead_pose
**Label:** Kneeling Torso Twist, Hand Resting Overhead

**Priority:** 14

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, sports bras, leggings, shorts

**Params:**
- **stance:** kneeling with both knees grounded, torso twisted to one side
- **hand_placement:** one hand resting on top of the head (hair, not garment — fine); other hand hovering beside the opposite knee, clear of the leg and hip
- **torso_angle:** three-quarter twist
- **head_orientation:** following the twist, turned to the side — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** averted to the side, focused
- **recommended_framing:** front_upper_crop
- **garment_visibility_priority:** shows torso-panel stretch and waistband transition under the twist

---

### standing_quad_stretch_knee_behind_pose
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

### foam_roller_seated_leg_extension_pose
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

### foam_roller_reclined_leg_raise_pose
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


### standing_dumbbell_curl_bent_elbow_pose
**Label:** Standing Dumbbell Curl, Bent Elbow, Close Crop

**Priority:** 17

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: crop tops, tank tops, sports bras

**Params:**
- **stance:** standing straight, weight even, grounded
- **hand_placement:** one hand curling a dumbbell (equipment) up toward the shoulder, elbow bent and close to the torso; other hand relaxed at the side, not resting on the hip
- **arm_position:** working arm fully flexed, forearm and bicep visibly engaged
- **torso_angle:** slight three-quarter turn, close crop
- **head_orientation:** turned toward the working side, focused — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct at camera or downward toward the curl
- **recommended_framing:** front_upper_crop, chest-to-waist
- **garment_visibility_priority:** shows underbust seam and sleeve/strap behavior under the flexed bicep

---

### resistance_band_hip_height_pull_pose
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

### standing_hamstring_curl_ball_squeeze_pose
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

### standing_ball_shoulder_hold_pose
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
- **garment_visibility_priority:** shows underbust seam and shoulder-strap construction under the raised, shoulder-height hold

---

### golf_glove_adjustment_pose
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

### golf_dress_club_planted_stance_pose
**Label:** Golf Dress — Relaxed Hand at the Side, Club Planted

**Priority:** 20

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, skirt
- Categories: dresses, skirts, polos

**Params:**
- **stance:** standing straight, feet close together, grounded — narrow, skirt-safe
- **hand_placement:** one hand relaxed at the side, fingers loosely together, not resting on the hip; other hand resting atop a club (equipment) planted upright on the ground beside the body
- **torso_angle:** three-quarter to side profile
- **head_orientation:** turned toward the camera or downrange, level — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **gaze_direction:** direct or averted to the side
- **recommended_framing:** full_front — a narrow standing stance, skirt-safe, no wide leg-spread
- **garment_visibility_priority:** skirt/dress hem and waistband transition stay fully visible in the upright stance

---

### tennis_standing_stretch_racket_reach_pose
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

### tennis_racket_shoulder_rest_pose
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
- **garment_visibility_priority:** shows shoulder-strap and collar construction against the resting racket

---

### tennis_ball_toss_racket_ready_pose
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

### tennis_dynamic_racket_overhead_carry_pose
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
- **recommended_framing:** full_front — the held stride and raised racket both need the whole body in frame; confirmed eligible per the `full_back` wide-stance ban in Non-Negotiable Rules above
- **garment_visibility_priority:** skirt/dress flare reads clearly under the dynamic lean

---

### side_plank_extended_reach_pose
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

### kneeling_leg_raise_back_pose
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

### athletic_crouched_pose
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
- **hand_placement:** one hand hovering beside the raised knee, fingers relaxed and loosely together, without touching it; opposite hand relaxed at the side or interacting with footwear (gripping a shoe is fine, distinct from resting on garment fabric) — never resting on the hip
- **torso_angle:** three-quarter turn
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** weight distributed between the raised foot and the lowered knee or ground
- **leg_position:** one knee raised high, opposite leg extended backward or bent, touching the ground
- **pose_energy:** dynamic
- **occlusion_avoidance:** ensure side leg stripes and garment proportions remain visible during the crouch

---

### athletic_crouch_squat_stance
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
- Bottom category: skirts, dresses (role-scoped to the bottom garment actually worn — never satisfied merely because a top/hero_garment like a sports bra matches; a client-confirmed rejection showed this exact wide crouch/hands-near-knees stance generated on a pleated tennis skirt)

**Params:**
- **stance:** deeply crouched squat stance with knees bent sharply
- **foot_position:** flat on the ground, shoulder-width apart
- **hand_placement:** right hand hovering beside the right knee, fingers relaxed and loosely together, without touching it; left hand hovering near the left shin, fingers relaxed and loosely together, without touching it
- **torso_angle:** three-quarter turn with rolled-forward shoulders
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **occlusion_avoidance:** arms and knees positioned to showcase crop top and short proportion

---

### athletic_rear_foot_elevation_stretch
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
- **hand_placement:** hands gripping the elevated foot/shoe (footwear, not garment) or braced on the floor
- **torso_angle:** profile or three-quarter turn, leaning forward slightly
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** distributed between the front foot/knee and the rear supporting limb
- **recommended_framing:** front_lower_crop or full_front
- **garment_visibility_priority:** displays stretch-fit garments and leg lines during active movement

---

### athletic_seated_stretch_pose
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
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **leg_position:** one leg extended straight forward, the other bent at the knee
- **pose_energy:** dynamic
- **garment_visibility_priority:** fitted top and bottom waistlines remain legible while folded

---

### athleisure_dynamic_waist_open_pose
**Label:** Athleisure Dynamic Stance, Relaxed Hands

**Priority:** 20

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, base_layer
- Categories: tops, sweatpants, leggings
- Fit: cropped, slim, relaxed

**Avoid when:**
- Categories: skirts, dresses
- Bottom category: skirts, dresses (role-scoped to the bottom garment actually worn — never satisfied merely because a top/hero_garment matches; a client-confirmed rejection showed this same wide stance family generated on a pleated tennis skirt)

**Params:**
- **stance:** wide stance with one leg bent and extended to the side
- **hand_placement:** one hand in a pocket (still eligible per the Global Rules), or both hands relaxed at the sides, fingers loosely together, without touching the hips or thighs — never resting on the hips/waist or the bent-knee thigh, in any angle
- **torso_angle:** three-quarter turn (right or left)
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** weight shifted dynamically to one side
- **garment_visibility_priority:** emphasize the crop-top and high-waist transition, exposing the midriff clearly

---

### athletic_standard_frontal_stance
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
- **stance:** feet shoulder-width apart, standing tall but not rigid — a real person's natural resting stance, not a braced or squared-off mannequin hold
- **hand_placement:** arms hanging naturally at the sides with relaxed fingers, or one hand carrying a bag/bottle (equipment)
- **torso_angle:** facing camera directly
- **weight_distribution:** weight settled naturally, subtly favoring one leg — never a perfectly even, forced-symmetric stand
- **head_orientation:** vary across variants — level and facing forward on one, chin tilted subtly down or head turned slightly to one side on the other; never the identical level-forward head on both variants of the same shot
- **shoulder_alignment:** relaxed and naturally level — not squared, braced, or pulled back
- **recommended_framing:** full_front — the fallback/baseline frontal shot, not the default register in this file
- **garment_visibility_priority:** full front silhouette of top and bottom garments fully visible

---

### athletic_back_view_pose
**Label:** Rear View Sport-Luxe Static Presentation

**Priority:** 26

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top, bottom, outerwear
- Categories: sweatshirts & hoodies, leggings, sweatpants, shorts, tops, t-shirts, jackets
- Fit: relaxed, fitted, skin-tight

**Conflicts with:** resistance_band_overhead_pull_back_pose

**This is `full_back`'s primary register**, per the `full_back` wide-stance ban in Non-Negotiable Rules above — the wide-stance/high-movement `full_back` entries were adapted into crop poses, leaving this static entry and one moderate standing entry (`resistance_band_overhead_pull_back_pose`) as `full_back`'s actual pool.

**Params:**
- **stance:** standing straight facing away from camera with a back view
- **hand_placement:** arms resting naturally at the sides, or holding an accessory (bottle, bag — equipment, not garment)
- **torso_angle:** facing away from camera (rear view)
- **weight_distribution:** even weight distribution across both legs
- **head_orientation:** turned to a near-profile or over-the-shoulder angle, varied across variants — favor this over a flat, un-turned back-of-head; a completely flat rear head on every variant is a confirmed client rejection
- **recommended_framing:** full_back — primary static register for this angle
- **garment_visibility_priority:** rear garment details, straps, back logos, and hem lines must be fully centered and unobstructed

---

### athleisure_full_body_neutral_stance
**Label:** Athleisure Full Body Neutral Stance

**Priority:** 27

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, base_layer
- Categories: t-shirts, tank tops, shorts, leggings
- Fit: relaxed, slim

**Params:**
- **stance:** standing with feet approximately shoulder-width apart, one foot slightly advanced — a natural, unposed stand, not a braced mannequin hold
- **hand_placement:** both arms hanging naturally at the sides with fingers relaxed
- **head_orientation:** straight, facing forward — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **torso_angle:** facing camera
- **weight_distribution:** weight settled naturally, subtly favoring the advanced foot — never a perfectly even, forced-symmetric stand
- **garment_visibility_priority:** ensure full visibility of the top and bottom silhouette without occlusion

---

### sport_luxe_front_pocket_pose
**Label:** Sport-Luxe Front Pocket Casual Pose

**Priority:** 45

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, base_layer
- Categories: tops, trousers, sweatpants
- Fit: regular, slim, wide-leg

**Params:**
- **stance:** standing straight with feet slightly apart or shoulder-width
- **hand_placement:** both hands tucked into trouser/sweatpant pockets — only when a worn garment's `pockets` attribute reports real pockets; pocket is an eligible fallback per the Global Rules, drawn from the shared fallback-gesture pool, not a default — should not be selected when any more athletic-register entry is eligible
- **torso_angle:** facing camera
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **weight_distribution:** weight distributed evenly across both feet
- **garment_visibility_priority:** emphasize clean lines of wide-leg trousers and tailored tops

---

### relaxed_pockets_stance
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
- **hand_placement:** both hands resting in trouser/sweatpant pockets — only when real pockets exist; pocket is an eligible fallback per the Global Rules, drawn from the shared fallback-gesture pool, not a default
- **torso_angle:** three-quarter right turn
- **head_orientation:** turned slightly left with an averted gaze — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **occlusion_avoidance:** arms positioned to maintain visibility of the top hem and pocket structure

---

### accessory_grip_frontal_stance
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
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants rather than repeating an identical angle on both
- **occlusion_avoidance:** arms kept clear of the torso to ensure an unobstructed view of the tucked or untucked top-and-bottom intersection

---

### asymmetric_shift_duffel_stance
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
- **hand_placement:** left arm relaxed at the side, not resting near the pocket/hip; right hand grips the duffel bag straps (equipment)
- **head_orientation:** turned slightly right and tilted downward — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both

---

### sport_luxe_skirt_side_turn
**Label:** Sport-Luxe Skirt Side Turn Pose

**Priority:** 37

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, layering_piece
- Categories: skirts, jackets, sweatshirts & hoodies
- Fit: slim, regular, a-line

**Params:**
- **stance:** standing straight with feet close together or slightly offset — narrow, skirt-safe
- **hand_placement:** one hand relaxed at the side, fingers loosely together, not resting on the hip; other arm hanging naturally or holding an accessory (equipment)
- **head_orientation:** turned to the side, looking back over the shoulder or averted — vary the exact degree/side across the two generated variants rather than repeating an identical angle on both
- **torso_angle:** three-quarter turn (left or right)
- **weight_distribution:** weight evenly distributed or slightly shifted on the legs
- **garment_visibility_priority:** showcase skirt pleats and jacket side-panel details

---

### seated_hands_clasped_relaxed_pose
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

---

## Non-Negotiable Guardrails Checklist

Every item below must be checked and confirmed "not violated" against the specific pose selection before it is used to build a generation prompt.

- [ ] Dynamic poses read deliberate and controlled, never a stumble or accident; static poses stay grounded (Global Rules)
- [ ] Entry's own alignment call is followed — asymmetric stays asymmetric, level stance stays clean and confident (Global Rules)
- [ ] No hand touches the garment, in any shot, in any angle (Global Rules)
- [ ] No hand/arm description anchors to the hip/thigh/waist and then negates contact (Global Rules)
- [ ] No free hand is described as "splayed," "spread," or "open," and no palm faces the camera (Global Rules)
- [ ] No hand rests on the hip or waist, in any pose, in any angle (Global Rules)
- [ ] Expression reads alive and engaged, and varies naturally across the two generated variants (Global Rules)
- [ ] `Avoid when` and `Conflicts with` are honored, never overridden by Priority (Global Rules)
- [ ] Priority is applied as rank-based tiers across the actual eligible pool for this job's angle — no single entry dominates, no eligible entry is left at a token/near-zero rate (Global Rules)
- [ ] No exaggerated, theatrical, or physically impossible pose (including any backbend) without QC sign-off (Global Rules)
- [ ] Reference hairstyle is kept as-is; no glamorous or theatrical posing (Global Rules)
- [ ] The full pose reads as one coherent, natural human action, not assembled from unrelated gestures (Global Rules)
- [ ] Every loaded equipment item is given an explicit placement and carried — never dropped to win on Priority (Equipment & Props)
- [ ] A hand may grip or hold equipment against the body, but never the garment (Equipment & Props)
- [ ] A relaxed, pocketed, or clasped-hand fallback is never substituted for a pose whose own Params call for an equipment interaction (Equipment & Props)
- [ ] Head/gaze follows the entry's own stated options and differs meaningfully between the two generated variants; no flat back-of-head on every rear variant (Head Movements)
- [ ] No walking or mid-stride gait, on any shot type (Non-Negotiable Rules — Negative)
- [ ] Footwear matches the activity; never barefoot when feet are in frame (Non-Negotiable Rules — Negative)
- [ ] Any wide-legged, open-stance, or straddle pose is never selected when the hero garment worn is a skirt or dress (Non-Negotiable Rules — Negative)
- [ ] The running-stride poses are never forward-facing, never airborne, never used on `full_front`/`full_back` (Non-Negotiable Rules — Negative)
- [ ] `full_back` never carries a wide-stance, high-movement dynamic pose (Non-Negotiable Rules — Negative)
- [ ] A pocketed hand (or any single fallback gesture) is never the default or most-frequent choice (Non-Negotiable Rules — Negative)
- [ ] `dynamic_torso_twist_hand_raised_pose` is never selected — retired (Non-Negotiable Rules — Negative)
- [ ] Feet/legs stay in frame per each angle's coverage contract; a raised or driven hand never clips the frame edge (Non-Negotiable Rules — Positive)
- [ ] A bottom-category hero garment is never routed to a `front_upper_crop`-only pose, and a top-category hero garment is never routed to a `front_lower_crop`-only pose (Non-Negotiable Rules — Positive)
- [ ] The running-stride poses' arm/hand/head mechanic matches the approved reference exactly, mirroring the Male file (Non-Negotiable Rules — Positive)
- [ ] The running-stride poses are not over-selected — target roughly 1 in 10 eligible jobs (Non-Negotiable Rules — Positive)
- [ ] Dynamic register stays primary on `front_upper_crop`/`front_lower_crop`; `full_front`/`full_back` stay static-primary with dynamic entries used only occasionally (Non-Negotiable Rules — Positive)
- [ ] The fallback-gesture pool rotates between a pocketed hand (garment has a real pocket), a relaxed-at-the-side hand, an equipment carry, and clasped hands — never an invented pocket (Non-Negotiable Rules — Positive)
