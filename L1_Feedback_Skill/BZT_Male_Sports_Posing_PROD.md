# Pose Library — BZT Male Sports

Posing rules for BZT Male Sports imagery — governs stance, hand placement, head/gaze, and framing for every generated shot.

---

## Global Rules

These are client-agnostic generation-quality principles. They are not specific to BZT or to this client's garments, and any similar pose-library job can reuse them as-is.

### Top Enforcement Priorities (P0/P1)

These two rules are this framework's highest-priority checks, verified first on every generated variant, ahead of every other rule in this file:
- **P0 — Body-to-face proportion ratio** (full rule further below, under Global Rules): the 7.25–7.5 crown-to-sole ÷ crown-to-chin target on `full_front`/`full_back`.
- **P1 — Ground-contact shadow** (rule immediately below): a visible, correctly-cast shadow under the feet on `full_front`/`full_back`.

**Rule:** On `full_front` and `full_back` shots only, the model must cast a soft, naturally soft-edged ground-contact shadow directly beneath the feet, visible on the seamless studio floor in every generated variant — a shadow-free floor under the feet is a confirmed QC rejection. The shadow is grounded exactly at the actual foot/shoe contact point(s); it reads as a soft, diffused mid-gray tone blending naturally into the backdrop — never a hard-edged black silhouette, never a stylized or graphic shape. It consistently falls toward camera-left, as if cast by a single soft key light positioned high and to camera-right — the same light direction on every shot, every variant, both angles. Shadow length and shape follow the actual stance: a static, feet-together or feet-apart stance casts a short, contained shadow close to the feet; a dynamic, wide, or bent-over stance casts a correspondingly longer, more visible shadow trail in the same camera-left direction. The shadow appears only on the floor plane — never cast onto a backdrop wall, never onto the model's own body or garment. Does not apply to `front_upper_crop`/`front_lower_crop`, which do not show the floor.
**Why:** QC-flagged P1 defect: current generations are producing a completely shadow-free floor under the model on `full_front`/`full_back`, which reads as an obviously composited studio cutout rather than a real photograph. The client's own approved reference photography consistently shows this exact soft, camera-left-falling ground-contact shadow on every full-body shot — it is the pattern to match, not an optional stylistic touch.

**Rule:** The model's body build — shoulder width, torso width, waist, and limb thickness — must match the reference model image's actual physique exactly, on every shot and every variant; never render the body broader, bulkier, heavier-set, or more muscular than the reference shows, and never render it thinner, frailer, or smaller-framed either. A pose's stance or a garment's volume may change how much of the body is visible, but must never be used to justify widening or narrowing the model's actual frame. This is independent of the body-to-face height ratio above — that rule governs vertical proportion (how tall the figure reads); this rule governs horizontal build (how wide/heavy the figure reads) — both must hold at once, and neither corrects for the other.
**Why:** Confirmed client rejections describe the model reading "like a giant being" with a body that "looks broader" than intended, and separately as looking "tiny" — both are the same underlying defect from opposite directions: the generation drifting the model's actual build away from the reference physique. Fixing height alone (the ratio rule) does not fix width; both must be enforced together, or a tall-but-bulky or slender-but-short figure can still pass the ratio check while failing this one.

**Rule:** The model's apparent age, facial expression, and face shape/structure must match the reference model image exactly, on every shot and every variant — never render a younger, teen-like, or otherwise age-shifted face; never invent a different expression than the reference's own; never round out, enlarge, or otherwise reshape the face's actual bone structure. This holds independently of camera angle, crop, or pose — a `full_back` or profile shot that only shows part of the face must still read as the same identity as the reference's front-facing shots.
**Why:** Confirmed client rejections describe generations where "facial expressions changed, looks like a teen," and separately where the "face shape becomes more round" and "bigger" — identity-drift defects distinct from hair preservation and from the body-to-face ratio: neither of those rules governs age, expression, or face shape, so this gap persists even with both fully enforced.

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

**Rule:** `Priority` on every entry in this file sets a probabilistic selection weight across a batch, not a deterministic pick order — apply it using rank-based tiers, not a fixed table, because the number of eligible entries for a given angle varies (this file's own pools range from 3 to 24 depending on angle). For a given job's actual eligible pool (after `Applies when`/`Avoid when` filtering for that angle and garment), rank the eligible entries by Priority, lowest first. Priority is a single global, sparse numbering scheme across this entire file, not reset per angle — the same number can appear on entries that apply to different angles, and real gaps exist within any one angle's own values (this file's `full_back` pool alone uses non-consecutive values like 16, 26, 28, not 1-2-3). Never compare a Priority number against entries from a different angle or against the file-wide sequence — build the eligible pool first, filtered to only the entries whose `Applies when`/`Avoid when` match this job's specific angle and hero garment category, then rank only within that pool, lowest surviving value first, ignoring the gaps between the numbers that remain. Then distribute selection likelihood across a batch of similar jobs roughly as: the top third of the ranked pool (rounded up, minimum 1 entry) collectively takes roughly 50-60% of selections; the middle third collectively takes roughly 25-35%; the bottom third collectively takes the remainder. Within each third, no single entry should exceed roughly 25% of all selections on its own, and no eligible entry should fall below a real, visible floor (roughly 2-3%) — an entry that is eligible but never actually gets picked across a batch is a defect, the same class of problem as one entry dominating. Recompute the tiers from whatever the actual eligible pool is for that job; do not hardcode which named entries fall in which tier, since entries get added, retired, or re-prioritized over time.
**Why:** A fixed percentage table (e.g. "Priority 1 = 40%, Priority 2 = 30%") only works for a pool of exactly four eligible entries — most angles in this file have far more, and Priority numbers are not sequential per angle, so no fixed table can apply uniformly. Rank-based tiers scale automatically to whatever pool size actually exists for a job, and don't need to be manually rebalanced every time an entry is added or removed. This rule is reinforced separately in the generation system's own selection instructions; stating it here as well means the guidance holds even when this file is read on its own, without that other context.

**Rule:** `Avoid when` and `Conflicts with` fields are binding, not advisory. Never override an `Avoid when` match to win on Priority, and never drop an item or detail in one generated variant that another variant of the same shot shows.
**Why:** These fields exist to encode hard eligibility and consistency constraints; treating them as optional guidance defeats their purpose and reintroduces the defects they were written to prevent.

**Rule:** No exaggerated, theatrical, or physically impossible pose is eligible — including any backward spinal arch or backbend — without an explicit QC sign-off flag.
**Why:** These read as exaggerated fashion or editorial poses rather than the grounded, achievable athletic register this framework targets, and are not supported by the reference evidence behind this file.

**Rule:** Keep the model's reference hairstyle exactly as shown — never restyle it into a more elaborate or editorial look. Avoid glamorous posing or theatrical flourish generally.
**Why:** The house register is a grounded, natural athletic presentation, not a fashion-editorial shoot; overstyled hair or theatrical posing works against that read.

**Rule:** Every pose must read as one single, coherent, natural human action — stance, hand/arm position, torso angle, and head/gaze together, not individually-valid body parts assembled from unrelated poses.
**Why:** This is a real, standing rejection reason distinct from any single mechanism like hand placement or clothing type. A pose can satisfy every other rule in this framework and still fail this one if the overall gesture reads as disjointed or borrowed — for example, a clenched or raised fist during a counterbalance reading as an unrelated boxing-guard gesture, or a hand tucked behind the lower back reading as a borrowed gesture rather than a natural counter-arm. This is a qualitative standard with no numeric threshold, but it is still a hard requirement: a pose that fails it needs its Params rewritten, not shipped on a technicality.

**Rule — Body-to-Face Ratio (P0, `full_front`/`full_back` only — does not apply to `front_upper_crop`/`front_lower_crop`, sole landmark out of frame).** Follow this build sequence for every variant:
1. **Target:** crown-to-sole height ÷ crown-to-chin head height = 7.25–7.5, aim 7.4–7.5. Below 7.25 or above 7.5 = rejection.
2. **Segment blueprint:** head+neck ≈1 head-height unit; torso (shoulder to hip) ≈2 units; leg (hip to sole) ≈4.25–4.5 units; total ≈7.25–7.5 units. If the leg segment reads short, extend the leg line (posture, verticality, stance) until it isn't — do not shrink the head to fix the math.
3. **Circle/oval check (the client's own literal QC method, checked independently of step 1):** picture a circle/oval the same size as the model's head, stacked edge to edge from crown to sole. 7.25–7.5 of those circles/ovals must exactly reach the sole — not short, not past it. Satisfy this directly, not just the division in step 1; both must hold at once.
4. **Overrides the reference photo.** This ratio beats the reference model photo's own natural proportions, without exception, on every variant. The reference still governs face, hair, skin tone, and build — never this ratio.
5. **Select the bottom-landmark foot:** (a) the foot flat and fully grounded; (b) if both feet are flat, the more weight-bearing/straighter load-bearing leg; (c) if weight looks even or symmetric, the leg positioned further back, or the model's own left leg as the final tie-break — same convention every time.
6. **Select the point on that foot:** flat shoes/sneakers/bare feet → lowest outsole layer touching the ground; heeled shoes → the heel-to-sole junction.
7. **Keep that point visible and unobstructed** — never cropped, hidden behind the other foot, or turned from camera.
8. **Never depict this on the image.** No measurement figures, ratios, proportion maps, or landmark labels rendered onto the photo — this is a posture/proportion outcome only. If numeric guidance causes stray text as a side effect, that's tolerable only in the background, never on the model, face, or garment.

**Why:** Client requirement, with a hard floor (7.25) and ceiling (7.5) — qualitative language alone ("elongated, smaller head") has been measured to plateau near 7.28, so a numeric anchor plus the client's own circle-count method are both needed. Applies only where the sole landmark is in frame. The photo must always read as an ordinary product shot — the ratio is achieved, never displayed.

**Rule:** The generated image should never contain visible text, numbers, or labels of any kind, and no rule in this file should be read as calling for one. If pursuing the body-to-face ratio target above ever causes the generation to produce such text as an unintended side effect, that is tolerable only when it lands entirely in the background/negative space, never overlapping or touching the model, face, hair, garment, or product — text or numbers appearing on the model or garment itself is a hard failure regardless of cause, since the background (unlike the product) is stripped out in the downstream editing pass.
**Why:** Real generation output has shown that detailed numeric proportion guidance can occasionally cause the image model to render body-landmark labels as literal on-image text. A background-only occurrence is a recoverable, low-cost side effect; the same defect on the model or garment would corrupt the actual product photo and is never acceptable.

---

## Equipment & Props

**Equipment & prop vocabulary** (from the BZT reference set), in rough order of frequency:
1. Both hands clasped low, as if gripping a club (golf address hinge).
2. One hand relaxed, fingers loosely together, hovering near the thigh without touching it, during a lunge or stretch.
3. One hand raised, resting a racket/club on the shoulder (equipment, not garment).
4. Both hands clasped behind the head (overhead flex).
5. Forearms crossed at the chest, held clear of the garment (guard stance).
6. Both hands kneeling, gripping equipment near the ground.
7. One arm securing a ball at the hip, chest, or behind the back — the ball, not the hand, contacts the body, which is fine.
8. One hand carrying a bag.
9. One hand curling a dumbbell.

Hand-on-hip/thigh and hands-on-hips-akimbo are retired from this vocabulary — hip and thigh contact are both banned outright; hovering near the body without touching it is the only acceptable substitute. See the hand-on-hip ban in Global Rules.

**Rule:** Every loaded item (equipment, a bag, a bottle) must be given an explicit placement and carried in the selected pose — this requirement outranks Priority. An entry that leaves hands empty must never be selected over an eligible entry that carries the item, even if the empty-handed entry has a better (lower) Priority number.
**Why:** Priority ordering exists to pick between otherwise-equivalent options, not to justify dropping a loaded item the job actually requires; letting Priority override this produces a real, visible missing-equipment defect.

**Note:** The garment-contact ban — a hand may grip or hold equipment against the body, but the garment itself may never be touched by a hand — is defined in full in Global Rules; see that section for the complete rule.

---

## Head Movements

**Rule:** Head orientation and gaze must follow each entry's own stated options, never defaulting to one repeated position. Where an entry lists more than one option, the two generated variants of the same shot must land on visibly different ones, and a flat, un-turned back-of-head must never appear on every variant of a rear-facing shot.
**Why:** Head/gaze is the primary source of visible variety between two otherwise-similar generated variants of the same shot. Repeating an identical head position on both variants, or defaulting every rear shot to a flat back-of-head, reads as a lack of real variation and is a confirmed rejection pattern.

**Rule:** On `full_front`, at least one of the two generated variants must show the model in genuine eye contact with the camera — a direct or near-direct gaze the viewer reads as engaged, not merely a head technically angled forward. A full profile turn with the gaze fully off-camera on every variant of a `full_front` shot is a confirmed rejection. Where option 5 below (turned toward profile) is selected, keep the turn moderate enough that some camera engagement remains perceivable — short of a full side profile that reads as disengaged.
**Why:** Confirmed client rejection: a `full_front` variant with the head turned to a near-profile and the gaze fully off-camera was rejected specifically for missing camera eye contact, while the same outfit and stance with the face forward and engaged was approved. This refines, not replaces, the existing variation requirement above — the two variants should still differ, but not by both losing camera engagement at once.

**Head-movement vocabulary** (from the BZT reference set, gender-agnostic — shared verbatim with the Female file). On front-facing shots, draw the actual head/gaze call from:
1. Direct-level frontal, eyes straight at camera.
2. Level, head/eyes turned to one side without dropping (a pure side-glance).
3. Turned to one side and tilted down together, a combined glance.
4. Chin dropped straight down toward the chest, eyes lowered, no side turn — discouraged, lower preference.
5. Turned toward profile with the chin very slightly lifted.
6. Head stays level and forward, only the gaze/eyes cast downward — discouraged, lower preference.

On rear-facing shots:
1. A near-profile turn to the LEFT, enough that part of the face (cheek/jaw line) is visible, not just the ear.
2. A near-profile turn to the RIGHT, enough that part of the face (cheek/jaw line) is visible, not just the ear.

**Rule:** On `full_back`, a flat, fully un-turned back-of-head is never acceptable on any variant — this replaces the softer "must never dominate" framing above specifically for `full_back`. Across the two generated variants of the same `full_back` shot, the head must turn to opposite sides — one variant option 1 (left), the other option 2 (right) — never the same side twice, and never both flat.
**Why:** Confirmed client rejection pattern: `full_back` generations with a flat or barely-turned back-of-head were rejected specifically for showing no face at all, while the client's own approved references consistently show a near-profile turn with part of the face visible. This is now a hard requirement for `full_back`, not a soft preference.

---

## Non-Negotiable Rules

Rules specific to BZT Male Sports that are not Global, Equipment & Props, or Head Movements content. Angle vocabulary used throughout this file: `full_front`, `full_back`, `front_upper_crop`, `front_lower_crop`. The BZT Male Sports house look is controlled athletic energy — the model reads as an athlete captured mid-action or in confident equipment-ready posture, not a static mannequin. `front_upper_crop` and `front_lower_crop` are built almost entirely around held dynamic action; `full_front` and `full_back` are the static-leaning angles. Static, level stands remain a valid fallback register, not the default.

### Prohibited / Must-Not-Happen conditions

**Rule:** A walking or mid-stride gait — one foot lifted and swinging as if caught mid-step — is prohibited completely, on every shot type, with no exception.
**Why:** A walking gait reads as an unintentional lifestyle candid, not a controlled athletic or fashion pose, and is rejected on every angle with no exception found. Genuine athletic motion — a jog/run stride, a lunge, a stretch — is not a walking gait and remains in scope.

**Rule:** Footwear must always match the implied activity (e.g. running shoes for a running pose, court shoes for a racket sport, training shoes for gym work) whenever feet are in frame. Bare feet are never acceptable in a full-body or lower-body shot.
**Why:** Mismatched or absent footwear breaks the athletic context the pose is built around, and bare feet is one of the most consistently rejected patterns in the evidence behind this framework.

**Rule:** The running/sprint-stride mechanic must never be forward-facing and must never render as an airborne "flying" pose; it must never appear on `full_front` or `full_back`.
**Why:** A forward-facing running stride is rejected in every angle in the underlying evidence, while a diagonal/sideways stride is explicitly accepted on crop shots only.

**Rule:** `full_back` must never carry a wide-stance, high-movement dynamic pose.
**Why:** The evidence behind this framework rejects wide-stance, high-movement `full_back` poses repeatedly with no exception, while multiple full-body, front-facing dynamic poses were explicitly approved on movement grounds alone.

**Rule:** `full_back` must never use an angular or three-quarter body turn — the torso stays squared to the camera, back predominantly flat-on, so the full product reads clearly across its whole width. A three-quarter rear turn, or the torso turned in profile, is a confirmed rejection for obscuring full product visibility, even when combined with a head turn that is otherwise allowed by Head Movements.
**Why:** Confirmed client rejection: a three-quarter turned back view was rejected specifically for not showing the full product, while a squared, straight-on back view of the same garment was approved. This is a hard boundary for `full_back`, not a style preference — the head may turn per Head Movements, but the torso/body must stay squared.

**Rule:** No hand-held prop, accessory, or piece of training equipment (ball, dumbbell, resistance band, jump rope, backpack, bag, bottle, racket, club) may appear on `full_front` or `full_back` — these two angles are hands-empty only. Props and equipment remain fully eligible on `front_upper_crop` and `front_lower_crop`.
**Why:** Confirmed client rejection: a `full_back` shot with a dumbbell held overhead was rejected against an otherwise-identical approved shot with the same stance and no prop. This is a hard boundary specific to the two full-body angles, not a general ban on equipment in this file.

**Rule:** A hand in a pocket (or any single fallback gesture) must never be the first-listed, most frequent, or default choice, and must never repeat identically across both variants of a shot.
**Why:** Treating any single fallback gesture (pocket included) as the default produces the same over-saturation problem that hand-on-hip caused before it was banned — a fallback needs to stay a fallback, not become the new default.

### Required/Allowed conditions

**Rule:** `full_front`, `full_back`, and `front_lower_crop` keep feet in frame; `front_upper_crop` is waist-up by definition. On any crop angle, whenever a pose's Params call for a raised, extended, or driven arm, position the subject with enough lateral margin that the hand stays completely inside the frame.
**Why:** Each angle has a fixed coverage contract; feet or a driven hand exiting the frame breaks that contract regardless of how correct the pose itself is.

**Rule:** Whenever a job's hero garment is a bottom-category item, it must never be routed to a pose whose only eligible `Angles` value is `front_upper_crop` — select an entry that also lists `front_lower_crop` (or `full_front`/`full_back`) among its Angles, or skip a `front_upper_crop`-only pose for that job. The reverse applies symmetrically: a top-category hero garment should not be routed to a `front_lower_crop`-only entry.
**Why:** `front_upper_crop` crops at the waistband/upper thigh and structurally cannot show a bottom garment's hem or leg line; `front_lower_crop` symmetrically cannot show a top garment's full construction. Routing the wrong hero-garment category to either angle crops the hero garment out of frame by construction. Entries whose stance genuinely doesn't translate to a lower-crop framing (an overhead flex, a seated curl, a golf address hinge) are left `front_upper_crop`-only on the assumption their hero garment is normally a top, not a bottom.

**Rule:** The running/sprint-stride mechanic (`dynamic_sprint_stride_pose`) is eligible on `front_upper_crop`/`front_lower_crop` only, and only in its diagonal/sideways form. Its arm, hand, and head/gaze description is locked to the approved reference mechanic: reciprocal arm drive with the trailing-leg-side arm forward and up (elbow near a right angle, hand at chest height, fingers relaxed and loosely curled together, palm inward/downward, never a clenched fist), the other arm mirrored back and down; head turned to a three-quarter/profile angle in the direction of movement with a level chin and the face fully visible; gaze directed into the distance in the direction of movement.
**Why:** A diagonal/sideways stride is explicitly accepted on crop shots only in the underlying evidence. The arm/hand/head mechanic is locked to the one reference image explicitly confirmed acceptable, to prevent drift back into a forward-facing or splayed-finger/palm-forward defect.

**Rule:** The running-stride entry is one eligible option among many, not a default — target roughly one selection in ten eligible jobs. Its Priority is set at the bottom of its eligible pool accordingly.
**Why:** Real output showed this entry selected in roughly 19 of 20 eligible jobs when it held a top Priority value, functioning as a de facto default rather than one option among many. Priority demotion is a mitigation, not a guaranteed fix — if over-selection persists after this change, the cause likely sits in the selection/weighting layer outside this file, not in the pose content itself.

**Rule:** `full_front` carries no wide-stance restriction — dynamic poses are fully eligible there; its lean toward static entries is a soft default, not a hard ban.
**Why:** Multiple full-body, front-facing dynamic poses were explicitly approved on movement grounds alone, unlike `full_back`.

**Rule:** `front_upper_crop` and `front_lower_crop` carry the dynamic register as their primary content. `full_front`/`full_back` are dominated by the still, level stand as their primary register, with select dynamic entries usable as occasional secondary full-body variants — not the default landing spot whenever a dynamic variant is wanted.
**Why:** This matches the reference set's actual distribution and keeps dynamic `full_front` entries from becoming an over-selected substitute for the static register that should remain the majority outcome there.

**Rule:** The fallback-gesture pool for this file rotates between a pocketed hand (only when the garment has a real pocket), a relaxed-at-the-side hand, and an equipment carry. When the garment has no real pocket, the pocketed-hand option drops out of the pool entirely for that job — never substituted with an invented pocket or an approximated reach toward where one would be. A relaxed hand at the side is always available regardless of garment or equipment, and is the correct default whenever nothing else in the pool applies.
**Why:** Rotating among several fallback gestures, rather than one, prevents any single fallback from becoming the new dominant gesture in place of the banned hip-rest.

---

## Entry Library

### dynamic_sprint_stride_pose
**Label:** Dynamic Full-Sprint Mid-Stride Drive

**Priority:** 25 — set to the bottom of the general-purpose band so it competes as one of many eligible entries rather than winning by default. Target roughly 1 selection in 10 eligible jobs, not the default.

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, shorts, leggings, vests
- Fit: skin-tight, slim, fitted, athletic-fit

**Avoid when:**
- Categories: trousers, suits, blazers & coats, jackets
- Bottom category: sweatpants, joggers, cargo pants with Fit: relaxed (role-scoped to the bottom garment actually worn — never satisfied merely because a top/hero_garment matches — a full-sprint drive doesn't suit a loose/relaxed bottom)

**Conflicts with:** static_full_body_pose, athleisure_frontal_standing_pose, squared_neutral_stance_back_pose

**The sole approved running-stride mechanic in this file, locked to the running-mechanic rule in Non-Negotiable Rules above.** Eligible on `front_upper_crop`/`front_lower_crop` only, never `full_front`/`full_back`; only the diagonal/sideways mechanic is acceptable, never forward-facing.

**Params:**
- **stance:** full mid-stride sprint drive, grounded and controlled — never an airborne leap. Lead leg driven forward and up with a sharp high-knee lift, trail leg extended back and bent, the trailing foot's toe/ball still in contact with or just leaving the ground
- **arm_position:** reciprocal arm drive — the arm on the same side as the trailing leg drives forward and up, elbow bent to roughly a right angle, hand at chest height, fingers relaxed and loosely curled together (a soft, natural running hand — never spread, splayed, or an open flat palm, never a clenched fist), palm facing inward/downward, never toward the camera; the other arm drives back and down at a mirrored bend, equally relaxed, never resting on or touching the hip/garment
- **torso_angle:** three-quarter turn at roughly 45 degrees, moving diagonally toward the camera or sideways across the frame — never angled or moving away from the camera
- **head_orientation:** turned to a three-quarter/profile angle in the direction of movement, chin level (never tilted down), face fully visible, looking ahead — not at the camera
- **gaze_direction:** directed off to the side into the distance, in the direction of movement — not down at the ground, not straight at the lens — focused, high intensity
- **weight_distribution:** dynamic, loaded onto the driving leg, always grounded
- **recommended_framing:** front_upper_crop or front_lower_crop — top of head to roughly mid-thigh, face always fully in frame. Never `full_front` or `full_back`
- **footwear:** when feet are in frame, the model always wears proper running shoes — never barefoot
- **garment_visibility_priority:** shows fabric stretch, drape and moisture-wicking behavior under real motion
- **movement_suggestion:** peak-action capture, a real grounded stride — never a jump, leap, or airborne moment

---

### weighted_equipment_curl_pose
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

### golf_address_hinge_pose
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

### crossed_forearm_guard_pose
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

### shoulder_rested_equipment_carry_pose
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

### kneeling_equipment_grip_pose
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
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **framing_intent:** intentionally tight/close crop on the hands-and-equipment interaction rather than the face
- **recommended_framing:** front_lower_crop — knee-to-shoe, hands prominent in frame
- **garment_visibility_priority:** unique view of short/trouser drape at the knee, sock compression, and shoe construction from a low, grounded angle
- **pose_energy:** focused, tense, suggesting readiness or mid-preparation

---

### athletic_prop_carry_pose
**Label:** Athletic Prop Carry — Hip or Chest Hold

**Priority:** 9

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, accessory
- Categories: tops, shorts, bags

**Narrowed to `front_upper_crop` only: its former rear-view/`full_back` variant (holding a ball behind the back) is retired outright, since props are now hard-banned on `full_back` and the variant had no non-prop version worth preserving on that angle.**

**Params:**
- **hand_placement:** variant A — one arm bent at the elbow securing a ball against the hip (the ball, not the hand, contacts the body — fine per the Global Rules); variant B — ball held at chest height with the opposite hand relaxed, not touching garment
- **torso_angle:** three-quarter turn toward the side holding the prop
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **weight_distribution:** static, centered balance
- **arm_position:** the carrying arm creates a triangular negative space between torso and elbow
- **recommended_framing:** front_upper_crop, hip or chest hold
- **garment_visibility_priority:** ensures the prop does not fully occlude chest logos or team crests

---

### athletic_ready_stance
**Label:** Athletic Ready Stance

**Priority:** 10

**Angles:** full_front

**Applies when:**
- Roles: top, bottom, accessory
- Categories: shirts, shorts, trousers
- Fit: regular, relaxed

**Avoid when:**
- Categories: jackets, outerwear

**Renamed and reworked: hand-held equipment is removed per the full_front/full_back no-props rule. The wide, low-center-of-gravity ready stance is kept — a distinct energy from this file's static/neutral baseline poses, per instruction, no equipment needed to read as athletic readiness.**

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** wide athletic stance, knees slightly bent (crouch) or feet stepped slightly apart
- **hand_placement:** both hands empty, relaxed and loosely curled at chest-to-waist height as if bracing for movement — never resting on the hip, never touching garment
- **torso_angle:** slight three-quarter turn
- **head_orientation:** focused toward the implied direction of play — vary the exact degree/side across the two generated variants
- **weight_distribution:** low center of gravity, weight shifted slightly forward toward the lead leg
- **movement_suggestion:** static but tense, suggesting immediate readiness for motion

---

### tactile_accessory_engagement
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
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **shoulder_alignment:** asymmetric — the engaged-side shoulder typically raised or rolled forward
- **recommended_framing:** front_lower_crop for a hand-carried bag, front_upper_crop for cap/watch adjustment
- **occlusion_avoidance:** accessory held to the side of the body line so it doesn't obscure hero-garment logos

---

### football_kneeling_ball_dribble_pose
**Label:** Kneeling Football Ball-Dribble Crouch

**Priority:** 13

**Angles:** full_front, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, shirts, shorts, socks

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** low crouch, one knee bent low toward the ground, weight forward over a football resting under one foot
- **hand_placement:** one hand hovering beside the raised knee, fingers relaxed and loosely together, without touching it; other hand relaxed or braced on the ground (not garment) for balance
- **torso_angle:** three-quarter turn, leaning forward and down toward the ball
- **head_orientation:** angled down toward the ball, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, absorbed in the ball
- **weight_distribution:** low, forward over the grounded foot and the ball
- **recommended_framing:** full_front or front_lower_crop — the foot-on-ball detail needs the lower body in frame
- **garment_visibility_priority:** shows kit crest, sock height, and short length in a genuine match-ready stance

---

### racket_behind_head_hold_pose
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

### backpack_strap_adjust_profile_pose
**Label:** Profile Stance Adjusting Backpack Strap

**Priority:** 14

**Angles:** front_upper_crop

Narrowed to `front_upper_crop` only: this pose's entire premise is the backpack-strap prop, which is now banned on `full_front`. The strap-adjust gesture remains fully eligible on `front_upper_crop`, where props are still allowed.

**Applies when:**
- Roles: hero_garment, top, outerwear, bag
- Categories: t-shirts, sweatshirts & hoodies, jackets, bags

**Params:**
- **stance:** standing profile, weight settled, torso turned to the side
- **hand_placement:** one hand raised, gripping or adjusting the backpack strap (equipment) at the shoulder; other arm relaxed at the side, not touching the garment
- **torso_angle:** profile to three-quarter turn
- **head_orientation:** turned back toward the camera over the strap-side shoulder — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct at camera or averted, alert
- **recommended_framing:** front_upper_crop — the strap-adjust gesture reads at this scale
- **garment_visibility_priority:** keeps the bag strap and shoulder seam legible without covering chest branding

---

### forward_bend_hands_open_stretch_pose
**Label:** Forward Bend, Relaxed Hands

**Priority:** 13

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, tank tops, sweatshirts & hoodies
- Fit: fitted, relaxed, regular

**Params:**
- **stance:** standing, knees softly bent, torso hinged forward at the waist
- **hand_placement:** both hands hovering just above the knees, fingers relaxed and loosely together, elbows out, without touching the legs
- **torso_angle:** deep forward hinge, profile to three-quarter
- **head_orientation:** down, following the line of the fold — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, absorbed in the stretch
- **weight_distribution:** even, grounded through both feet
- **recommended_framing:** front_upper_crop, chest-to-thigh — the hands-near-knees hinge is the focal action
- **garment_visibility_priority:** shows shoulder/back panel stretch and chest graphic under the forward fold

---

### bent_over_shoe_sock_adjust_pose
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

### football_ball_hip_carry_pose
**Label:** Football Kit — Ball Secured at the Hip

**Priority:** 13

**Angles:** front_upper_crop

**Narrowed to `front_upper_crop` only: dropped its former `full_front` eligibility, since props are now hard-banned on `full_front` and this entry's whole premise is the held ball. It stays fully eligible, prop and all, on the crop angle.**

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
- **recommended_framing:** front_upper_crop
- **garment_visibility_priority:** chest crest and sponsor branding stay fully visible past the carrying arm

---

### tennis_forward_ready_stance_pose
**Label:** Tennis Forward-Bent Ready Stance

**Priority:** 13

**Angles:** front_upper_crop, full_front

**Applies when:**
- Roles: hero_garment, top
- Categories: polos, shirts
- Fit: fitted, slim

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** forward-bent ready stance, knees bent, weight low, feet staggered
- **hand_placement:** both hands held low in front of the body as if gripping a racket in the ready position
- **torso_angle:** three-quarter, leaning forward
- **head_orientation:** level, focused forward — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct forward, high alertness
- **recommended_framing:** front_upper_crop or full_front
- **garment_visibility_priority:** collar and placket detail stay legible through the forward lean

---

### golf_club_shoulder_static_profile_pose
**Label:** Golf — Club Resting on the Shoulder, Static Profile

**Priority:** 13

**Angles:** front_upper_crop

**Narrowed to `front_upper_crop` only: dropped its former `full_front` eligibility, since props are now hard-banned on `full_front` and this entry's whole premise is the shoulder-rested club. It stays fully eligible, club and all, on the crop angle.**

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
- **recommended_framing:** front_upper_crop
- **garment_visibility_priority:** trouser break at the ankle and polo collar both stay legible

---

### golf_ready_focused_stance_pose
**Label:** Golf — Focused Downrange, Relaxed Hands

**Priority:** 14

**Angles:** full_front

**Renamed detail and reworked: the golf glove is removed per the full_front/full_back no-props rule. The focused, downrange head/gaze direction is kept as the entry's distinguishing feature.**

**Applies when:**
- Roles: hero_garment, top
- Categories: polos, trousers, shorts

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing straight, weight even
- **hand_placement:** both hands relaxed at the sides, fingers loosely together — not resting on the hip; no equipment
- **torso_angle:** three-quarter turn
- **head_orientation:** turned to the side, gaze directed off toward the implied fairway — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side, focused
- **recommended_framing:** full_front
- **garment_visibility_priority:** waistband and polo tuck fully visible

---

### zip_hoodie_hands_clasped_profile_pose
**Label:** Zip Hoodie — Hands Clasped Low, Profile, Head Down

**Priority:** 15

**Angles:** front_upper_crop, full_front

**Applies when:**
- Roles: hero_garment, top, outerwear
- Categories: sweatshirts & hoodies
- Closure: zip

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing, weight settled, profile to three-quarter turn
- **hand_placement:** both hands clasped together low in front of the body — hands touch each other, not garment
- **torso_angle:** profile to three-quarter turn
- **head_orientation:** tilted down, following the line of the clasped hands — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, calm and unposed
- **recommended_framing:** front_upper_crop or full_front
- **garment_visibility_priority:** zip pull, drawstring, and hood construction stay legible in the profile turn

---

### front_zip_jacket_forward_lean_pose
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

### plank_position_floor_pose
**Label:** Plank Position, One Arm Braced, Body Diagonal

**Priority:** 15

**Angles:** front_lower_crop

**Applies when:**
- Roles: hero_garment, bottom
- Categories: shorts, t-shirts, tank tops

**Params:**
- **stance:** plank position, body forming a straight diagonal line from head to heel, supported on one braced forearm/hand and both feet
- **hand_placement:** one arm braced flat on the floor/mat (not garment) bearing weight; other hand extended forward, fingers relaxed and loosely together, not resting on the hip
- **torso_angle:** three-quarter, diagonal toward the camera
- **head_orientation:** turned to the side, chin roughly level with the shoulder — vary the exact degree/side across the two generated variants
- **gaze_direction:** averted to the side, focused
- **recommended_framing:** front_lower_crop, hip-to-foot — the diagonal leg line and short length are the focal detail
- **garment_visibility_priority:** shows the short's rise and leg-line stretch under the plank extension

---

### golf_glove_adjustment_pose
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

### crouched_dual_dumbbell_hold_pose
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

### standing_dumbbell_curl_bent_elbow_pose
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

### relaxed_arms_natural_drop_back_pose
**Label:** Rear View, Both Arms Natural Relaxed Drop

**Priority:** 16

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, sweatshirts & hoodies, shorts, sweatpants, trousers

**Conflicts with:** squared_neutral_stance_back_pose

Client-approved reference pose. Both arms hang naturally at the sides with a soft, slight elbow bend, hands clear of the body — never rigid-straight, never reaching overhead. This is the primary contained-movement register for `full_back`, alongside `squared_neutral_stance_back_pose`, `forward_ease_wrists_loose_back_pose`, and `contained_outerwear_stance_back_pose`.

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing straight, weight even and grounded, torso squared to camera
- **hand_placement:** both arms hang naturally at the sides with a soft, slight elbow bend, hands loosely open and clear of the body, fingers relaxed — arms extended down along the sides, never lifted overhead
- **torso_angle:** facing away from camera (rear view), squared — no angular or three-quarter turn
- **head_orientation:** draws from the Head Movements vocabulary's rear-facing hard rule — a near-profile turn with part of the face visible on every variant, alternating sides (one variant left, the other right); a flat, un-turned back-of-head is never acceptable here
- **weight_distribution:** even, grounded
- **recommended_framing:** full_back
- **garment_visibility_priority:** back-panel seams, straps, and branding stay fully legible with both hands clear of the torso

---

### forward_ease_wrists_loose_back_pose
**Label:** Rear View, Arms Bent With Wrists Drawn Forward

**Priority:** 17

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, sweatshirts & hoodies, shorts, sweatpants

Client-approved reference pose. Both arms bend gently at the elbow with the hands drawn loosely toward the front of the body, out of frame from directly behind — a soft, unforced bend, distinct from the straight-arm baseline of `relaxed_arms_natural_drop_back_pose`. Never an overhead reach.

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing straight, weight even and grounded, torso squared to camera
- **hand_placement:** both arms bend gently at the elbow with a soft, unforced curve, hands drawn loosely toward the front of the body, low enough to sit just out of frame or only barely visible from directly behind
- **torso_angle:** facing away from camera (rear view), squared — no angular or three-quarter turn
- **head_orientation:** draws from the Head Movements vocabulary's rear-facing hard rule — a near-profile turn with part of the face visible on every variant, alternating sides (one variant left, the other right); a flat, un-turned back-of-head is never acceptable here
- **weight_distribution:** even, grounded
- **recommended_framing:** full_back
- **garment_visibility_priority:** back-panel seams, straps, and branding stay fully legible; the soft forward bend keeps both elbows clear of the garment's rear detailing

---

### seated_dumbbell_curl_pose
**Label:** Seated Dumbbell Curl, Close Crop

**Priority:** 24

**Angles:** front_upper_crop

**Applies when:**
- Roles: hero_garment, top
- Categories: t-shirts, tank tops
- Fit: fitted, slim

**Params:**
- **stance:** seated, torso upright, elbows braced near the torso
- **hand_placement:** one hand curling a dumbbell (equipment) close to the chest; other hand relaxed, fingers loosely together, hovering near the thigh without touching it
- **arm_position:** working arm flexed, forearm close to the body
- **torso_angle:** slight three-quarter turn
- **head_orientation:** turned down toward the curl, focused — vary the exact degree/side across the two generated variants
- **gaze_direction:** downward, absorbed in the movement
- **recommended_framing:** front_upper_crop, chest-to-waist — a seated close crop, not a full-body shot
- **garment_visibility_priority:** shows chest and shoulder fabric behavior under the seated, close-elbow curl

---

### athleisure_dynamic_motion_pose
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
- Bottom category: sweatpants with Fit: relaxed (role-scoped to the bottom garment actually worn — never satisfied merely because a top/hero_garment matches; a lunging/stretching stance with one leg bent or lifted doesn't suit a loose/relaxed bottom)

**Conflicts with:** athleisure_frontal_standing_pose, contained_outerwear_stance_back_pose

**Params:**
- **stance:** lunging or stretching stance with one leg bent or lifted; when the running variant is selected, use the approved running-stride mechanic instead (see `dynamic_sprint_stride_pose`) — always grounded, never an airborne "flying" pose
- **hand_placement:** hands clasped together near the knees without touching them, extended forward in a stretch, or holding accessories (equipment); for the running variant, both hands relaxed with fingers loosely curled in a reciprocal drive, never a clenched fist
- **head_orientation:** turned slightly upward and toward the side, following the action trajectory — vary the exact degree/side across the two generated variants
- **torso_angle:** three-quarter turn or profile view; for the running variant, angled diagonally toward the camera or sideways at roughly 45 degrees, never away from the camera
- **gaze_direction:** directed away from camera or focused forward-left
- **weight_distribution:** dynamic, shifting forward or supported on a single planted leg
- **recommended_framing:** front_upper_crop or front_lower_crop for the stretch variant; same, per the running-mechanic rule, for the running variant — never `full_front` or `full_back`
- **movement_suggestion:** stretching or kicking motion, held and controlled; the running variant is a grounded full-sprint drive, never a jump or leap

---

### athletic_hero_garment_pose
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

No equipment or accessory on `full_front` — both hands relaxed and empty.

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** feet apart, weight distributed dynamically forward or shifted to one leg
- **hand_placement:** both hands relaxed and empty — one loose at the side, the other loose at the side or lightly grazing the hip, never resting fully on the hip; never in a pocket as the primary look, which reads as casual lifestyle rather than sportswear
- **torso_angle:** three-quarter turn to show garment fit and athletic posture
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **gaze_direction:** direct at camera
- **weight_distribution:** dynamic, slightly forward or shifted to the front leg
- **occlusion_avoidance:** arms positioned away from the body to reveal logo and chest graphics

---

### athleisure_relaxed_pocket_asymmetry
**Label:** Relaxed Asymmetric Jacket Pose

**Priority:** 18

**Angles:** full_front

**Applies when:**
- Roles: outerwear, top
- Categories: jackets, sweatshirts & hoodies
- Fit: slim, regular
- Closure: zip

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **hand_placement:** one hand fully inserted into the jacket pocket (eligible fallback, not garment contact per se — only when the jacket has a real pocket; otherwise both hands hang relaxed at the sides); the other hanging naturally at the side, fingers loose, clear of the body
- **torso_angle:** three-quarter turn relative to the camera
- **head_orientation:** tilted slightly down, turned toward the leading shoulder — vary the exact degree/side across the two generated variants
- **gaze_direction:** directed downward toward the ground
- **weight_distribution:** relaxed contrapposto, weight on the back leg
- **shoulder_alignment:** slight forward roll on the pocketed-hand side
- **occlusion_avoidance:** the pocketed hand must not distort the jacket's hemline or front closure

---

### static_full_body_pose
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
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing tall, feet shoulder-width apart — a natural, unposed stand, not a braced or squared-off mannequin hold
- **hand_placement:** both arms hanging relaxed at the sides, fingers slightly curled — this is the pure neutral-stand register, kept distinct from `athleisure_frontal_standing_pose`'s pocket variant
- **torso_angle:** facing camera directly
- **head_orientation:** vary across variants — level and facing forward on one, chin tilted subtly down or head turned slightly to one side on the other
- **gaze_direction:** direct, looking straight into the camera, or following the head tilt/turn
- **weight_distribution:** weight settled naturally, subtly favoring one leg — never a perfectly even, forced-symmetric stand
- **shoulder_alignment:** relaxed and naturally level — not squared, braced, or pulled back
- **garment_visibility_priority:** full front silhouette and vertical drape visible
- **recommended_framing:** full_front — the fallback/baseline frontal shot, not the default register in this file

---

### squared_neutral_stance_back_pose
**Label:** Rear View Squared Neutral Standing Presentation

**Priority:** 26

**Angles:** full_back

**Applies when:**
- Roles: hero_garment, outer layer, top, bottom
- Categories: t-shirts, shirts, jackets, sweatshirts & hoodies, sweatpants, trousers, shorts

**Avoid when:**
- Roles: accessory

**Conflicts with:** relaxed_arms_natural_drop_back_pose

Client-approved reference pose — the plain neutral baseline. Standing straight with both arms relaxed straight down at the sides, minimal movement, a contained silhouette. Distinct from `relaxed_arms_natural_drop_back_pose` by having no elbow bend at all — the plainest, most neutral of the four `full_back` entries.

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing straight, feet shoulder-width apart or slightly apart, torso squared to camera
- **torso_angle:** facing away from camera (rear view), squared — no angular or three-quarter turn
- **head_orientation:** draws from the Head Movements vocabulary's rear-facing hard rule — a near-profile turn with part of the face visible on every variant, alternating sides (one variant left, the other right); a flat, un-turned back-of-head is never acceptable here
- **hand_placement:** arms relaxed straight down at the sides, minimal bend, hands loosely open — no equipment or accessory on `full_back`
- **gaze_direction:** not visible (back to camera)
- **weight_distribution:** even weight distribution across both legs
- **garment_visibility_priority:** back yoke, branding, and rear garment drape must remain fully visible
- **recommended_framing:** full_back — primary static register for this angle

---

### athleisure_frontal_standing_pose
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

**Conflicts with:** athleisure_dynamic_motion_pose, contained_outerwear_stance_back_pose, squared_neutral_stance_back_pose

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing straight, feet shoulder-width apart, flat on the ground, weight subtly shifted to one side
- **hand_placement:** one hand in a pocket (only when the garment has a real pocket; otherwise both hands hang relaxed at the sides), the other hangs relaxed at the side — deliberately distinct from `static_full_body_pose`'s pure arms-at-sides look. Never resting on the hip/waist, in any angle
- **head_orientation:** frontal and level on one variant, subtly tilted or turned on the other
- **torso_angle:** facing camera
- **gaze_direction:** direct, looking straight into the camera
- **weight_distribution:** matches the stance's own subtle weight shift to one side — never corrected back to a perfectly even, forced-symmetric stand
- **occlusion_avoidance:** arms kept clear of the torso to ensure full visibility of graphic prints and logos

---

### contained_outerwear_stance_back_pose
**Label:** Rear View, Contained Stance for Bulkier Outerwear

**Priority:** 28

**Angles:** full_back

**Applies when:**
- Roles: top, outerwear, hero_garment
- Categories: jackets, sweatshirts & hoodies

**Avoid when:**
- Roles: dress
- Categories: dresses, skirts

**Conflicts with:** athleisure_dynamic_motion_pose

Client-approved reference pose. Standing straight with both arms relaxed at the sides but held with a small, natural gap from the torso — enough to keep a bulkier outerwear piece's silhouette, hood construction, and side seams unobstructed, without reading as a wide-stance or dynamic pose.

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing straight, feet slightly apart, torso squared to camera
- **hand_placement:** both arms relaxed at the sides with a small natural gap from the torso, hands loosely open — never lifted overhead, never pressed against the garment
- **head_orientation:** draws from the Head Movements vocabulary's rear-facing hard rule — a near-profile turn with part of the face visible on every variant, alternating sides (one variant left, the other right); a flat, un-turned back-of-head is never acceptable here
- **torso_angle:** facing away from camera (rear view), squared — no angular or three-quarter turn
- **gaze_direction:** not visible, directed away from camera
- **garment_visibility_priority:** outerwear silhouette, hood construction, and side-seam/hem details stay unobstructed by the arms

---

### profile_casual_pose
**Label:** Profile and Three-Quarter Casual Presentation

**Priority:** 29

**Angles:** full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, jackets, trousers
- Fit: regular, relaxed
- Length: full-length, hip-length

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing straight and grounded, both feet planted — never a walking or mid-stride gait
- **torso_angle:** profile left or three-quarter right turn
- **head_orientation:** turned downward and forward or facing camera
- **hand_placement:** hand in a pocket (only when the garment has a real pocket) — never resting on the hip/waist, in any angle; no equipment or accessory on `full_front`
- **gaze_direction:** averted downward or direct at camera
- **weight_distribution:** balanced evenly or slight weight shift

---

### athleisure_seated_relaxed_pose
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
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** sitting on the floor, knees bent and drawn up
- **hand_placement:** hands resting clasped near the knee, not touching it — hands touch each other, not garment
- **head_orientation:** turned slightly toward the camera with a gentle tilt — vary the exact degree/side across the two generated variants
- **torso_angle:** three-quarter right turn
- **gaze_direction:** direct gaze toward the camera
- **weight_distribution:** seated balance, weight supported by hips and legs on the floor
- **seated_variation:** floor sitting with three-quarter crop framing

---

### athleisure_hands_behind_back_static
**Label:** Static Squared Pose with Hidden Hands

**Priority:** 36

**Angles:** full_front

**Applies when:**
- Roles: top, bottom
- Categories: t-shirts, shorts
- Fit: regular, relaxed

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing, legs spaced shoulder-width apart — a natural, unposed stand, not a braced military bearing
- **hand_placement:** both hands positioned behind the back, clasped at the lower back — hands touch each other, not garment
- **torso_angle:** facing directly toward the camera
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **shoulder_alignment:** relaxed and naturally level — not squared, braced, or pulled back
- **weight_distribution:** weight settled naturally, subtly favoring one leg — never a perfectly even, forced-symmetric stand
- **cropping_preference:** three-quarter shot (chest to below knees) to focus on the top-and-bottom interaction
- **body_line:** clean vertical lines emphasizing the silhouette of the top-and-bottom set

---

### set_presentation_contrapposto
**Label:** Relaxed Tonal Set Presentation

**Priority:** 45

**Angles:** full_front

**Applies when:**
- Roles: set_piece, hero_garment
- Categories: t-shirts, shorts, sweatshirts & hoodies, sweatpants
- Fit: relaxed

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** feet roughly shoulder-width apart, one leg may be slightly bent
- **weight_distribution:** subtle contrapposto, weight biased toward one hip
- **hand_placement:** one hand tucked into a pocket with thumb visible, other hand hanging relaxed — last-resort only: pocketed hands stay low-priority and should not be selected when any more athletic-register entry is eligible
- **torso_angle:** slight three-quarter turn to the camera
- **head_orientation:** draws from the Head Movements vocabulary rather than a generic tilt — vary which named movement lands on each of the two generated variants
- **pose_energy:** relaxed and poised, suitable for lifestyle/athleisure marketing
- **negative_space:** captured to show the drape of untucked hems against the bottom garment

---

### urban_utilitarian_relaxed_pose
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
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** feet wider than shoulder-width, slightly asymmetric foot direction or profile/three-quarter lean
- **hand_placement:** hands tucked into front jacket or trouser pockets — last-resort only: pocketed hands stay low-priority and should not be selected when any more athletic-register entry is eligible; no equipment or accessory on `full_front`
- **torso_angle:** facing camera or slight three-quarter turn to showcase side seams
- **weight_distribution:** weight shifted to one hip (contrapposto) for a relaxed, lifestyle silhouette
- **head_orientation:** tilted slightly downward, gaze can be averted or direct — vary the exact degree/side across the two generated variants
- **shoulder_alignment:** relaxed, slightly dropped or rolled forward to accommodate oversized volume
- **cropping_preference:** full body or three-quarter to show the stacking behavior of trousers at the footwear
- **garment_visibility_priority:** emphasizes volume, pocket utility, and layered texture of technical streetwear

---

### bird_dog_kneeling_extension_pose
**Label:** Quadruped Kneeling Leg Extension (Bird-Dog)

**Priority:** 18

**Angles:** front_lower_crop

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

### boxing_guard_crouch_pose
**Label:** Boxing Guard Crouch, Fists Raised

**Priority:** 19

**Angles:** front_upper_crop, front_lower_crop

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: t-shirts, tank tops, shorts

**Params:**
- **stance:** athletic boxing stance, knees bent, feet staggered, weight low and balanced
- **hand_placement:** both fists raised near the chin/chest in a guard position, not touching the chest garment, elbows in
- **torso_angle:** three-quarter turn, shoulders squared to the lead side
- **head_orientation:** level, chin slightly tucked, focused forward — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct at camera or forward, intense and alert
- **weight_distribution:** low, evenly balanced between the staggered feet
- **recommended_framing:** front_upper_crop, chest-to-waist — or, when shorts are the hero garment, front_lower_crop instead, so the staggered-stance leg line and hem are fully captured
- **garment_visibility_priority:** shows the t-shirt/tank hem line and shoulder mobility under the guard position; on `front_lower_crop`, extends to full leg-line and hem visibility

---

### resistance_band_chest_pull_pose
**Label:** Resistance Band Chest-Height Pull

**Priority:** 20

**Angles:** front_upper_crop

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

### side_plank_extended_reach_pose
**Label:** Side Plank, Top Arm Extended

**Priority:** 21

**Angles:** front_lower_crop

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

### standing_one_leg_balance_reach_pose
**Label:** Standing One-Leg Balance, Arms Raised Overhead

**Priority:** 22

**Angles:** front_upper_crop, full_front

**Applies when:**
- Roles: hero_garment, top, bottom
- Categories: tank tops, t-shirts, shorts

**Params:**
- **body_proportion_check (P0, non-negotiable):** before finalizing this pose's composite_direction, the crown-to-sole span — picture a circle/oval the same size as this model's own head, stacked repeatedly from crown straight down to sole — must land at 7.25–7.5 head-sized circles/ovals (units) — roughly head+neck ≈1 unit, torso (shoulder to hip) ≈2 units, leg (hip to sole) ≈4.25–4.5 units. This overrides any conflicting signal from the reference photo's own proportions, on every variant, without exception — extend posture, verticality, and leg-line description until the count is met; never shorten the described stance to fit the frame instead.
- **stance:** standing balanced on one leg, opposite foot placed against the inner standing thigh or calf, knee turned out
- **arm_position:** both arms raised straight overhead, palms together or fingers laced
- **torso_angle:** frontal to slight three-quarter, tall and lengthened through the spine
- **head_orientation:** level, facing forward, or tilted gently up toward the raised hands — vary the exact degree/side across the two generated variants
- **gaze_direction:** direct at camera or softly upward, focused and calm
- **weight_distribution:** fully loaded onto the standing leg
- **recommended_framing:** front_upper_crop or full_front — the raised-arm line needs headroom
- **garment_visibility_priority:** stretches the torso panel and underarm construction fully into view

---

## Non-Negotiable Guardrails Checklist

Every item below must be checked and confirmed "not violated" against the specific pose selection before it is used to build a generation prompt.

- [ ] **P0** — On `full_front`/`full_back` only, the body-to-face pixel ratio is as close to 7.5 as possible without exceeding it (7.25-7.5 acceptable; below 7.25 or above 7.5 is a rejection), achieved through posture, proportion, and the ~7.3-7.5-head-heights-tall anchor — never by instructing the generation to display measurement figures or labels (Global Rules)
- [ ] **P1** — On `full_front`/`full_back` only, a soft, camera-left-falling ground-contact shadow is visible under the feet on every variant — never a shadow-free floor (Global Rules)
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
- [ ] Head/gaze follows the entry's own stated options and differs meaningfully between the two generated variants; no flat back-of-head on every rear variant (Head Movements)
- [ ] On `full_back`, part of the face is visible via a near-profile turn on every variant, alternating left/right across the two variants — never a flat, fully un-turned back-of-head (Head Movements)
- [ ] No walking or mid-stride gait, on any shot type (Non-Negotiable Rules — Negative)
- [ ] Footwear matches the activity; never barefoot when feet are in frame (Non-Negotiable Rules — Negative)
- [ ] The running-stride pose is never forward-facing, never airborne, never used on `full_front`/`full_back` (Non-Negotiable Rules — Negative)
- [ ] `full_back` never carries a wide-stance, high-movement dynamic pose (Non-Negotiable Rules — Negative)
- [ ] A pocketed hand (or any single fallback gesture) is never the default or most-frequent choice (Non-Negotiable Rules — Negative)
- [ ] Feet stay in frame per each angle's coverage contract; a raised or driven hand never clips the frame edge (Non-Negotiable Rules — Positive)
- [ ] A bottom-category hero garment is never routed to a `front_upper_crop`-only pose, and a top-category hero garment is never routed to a `front_lower_crop`-only pose (Non-Negotiable Rules — Positive)
- [ ] The running-stride pose's arm/hand/head mechanic matches the approved reference exactly (Non-Negotiable Rules — Positive)
- [ ] The running-stride pose is not over-selected — target roughly 1 in 10 eligible jobs (Non-Negotiable Rules — Positive)
- [ ] Dynamic register stays primary on `front_upper_crop`/`front_lower_crop`; `full_front`/`full_back` stay static-primary with dynamic entries used only occasionally (Non-Negotiable Rules — Positive)
- [ ] The fallback-gesture pool rotates between a pocketed hand (garment has a real pocket), a relaxed-at-the-side hand, and an equipment carry — never an invented pocket (Non-Negotiable Rules — Positive)
- [ ] The model's body build (shoulder/torso width, limb thickness) matches the reference physique exactly — never rendered broader/bulkier or thinner/smaller-framed (Global Rules)
- [ ] The model's apparent age, facial expression, and face shape match the reference exactly — never younger, teen-like, rounder, or bigger-faced (Global Rules)
- [ ] No visible text, numbers, or labels appear on the image; any incidental occurrence stays confined to the background, never touching the model or garment (Global Rules)
