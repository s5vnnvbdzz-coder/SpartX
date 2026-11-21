# SpartanX Scientific Training Intelligence — Phase 2 v0.1

**Status: evidence-informed programme laboratory / read-only prototype. Not a validated coaching engine.**

Preview URL when deployed: \`/SpartX/science/\`.
Source: \`assets/science/evidence-engine.js\`, \`science/index.html\`.

## What this phase adds
- Separate **bodybuilding, powerlifting and powerbuilding** 3–6 day planning templates.
- Choice of goal, experience, weekly training days, session time, equipment, priority and review horizon.
- Exercise-level **RIR, sets, reps, rest, rationale and source IDs**.
- **Direct sets + 0.5 × indirect sets** exposure calculation (transparent accounting, not an exact physiological model).
- Programme audits for exercise coverage, equipment availability, S/B/D specificity, high axial-overlap, training-time limits and large weekly volumes.
- Read-only **linked-session progression advisory** requiring completed sets, matching programme and exercise IDs and valid effort logs.
- Exportable JSON previews to examine programme quality without changing live workouts.

## Data safety contract
Neither the generator nor the preview calls localStorage write APIs or edits \`spartx_db\`, \`spartx_draft_v1\`, \`ascensionx_strength_v1\`, bodybuilder programmes or any 5/3/1 cycle. No cloud sync or account integration is claimed. Export downloads a new local JSON file.

The preview is **not currently available as a workout import**; future integration requires validated mappings, explicit athlete approval, conflict checks, backwards-compatible plan versioning, and preserving active AscensionX cycles.

## Evidence register (auditable source IDs)
- **ACSM2026** — ACSM position stand (overview of 137 reviews): https://pubmed.ncbi.nlm.nih.gov/41843416/
- **PELLAND2026** — Volume/frequency dose-response meta-regressions: https://pubmed.ncbi.nlm.nih.gov/41343037/
- **ROBINSON2024** — Exploratory proximity-to-failure meta-regressions: https://pubmed.ncbi.nlm.nih.gov/38970765/
- **AUTOREG2025** — Autoregulation network meta-analysis: https://pubmed.ncbi.nlm.nih.gov/40791980/

**Evidence must not be overstated:** no study provides a universally validated numerical stimulus-to-fatigue score for every exercise. Exercise-specific axial-loading classifications and RIR thresholds are transparent engineering/coaching heuristics rather than direct trial outcomes. Actual set targets depend on training history and the individual.

## Next engineering milestones
1. Connect existing SpartanX exercise taxonomy, validate target muscle annotations and substitutions.
2. Add robust main-lift intensity prescription using athlete-specific verified 1RMs and existing AscensionX data without double-counting or overwrites.
3. Link saved workouts to scientific-plan IDs (after safe opt-in) and conduct longitudinal performance testing.
4. Evaluate performance, recovery, compliance, progression, sex/experience evidence gaps and high-risk athlete scenarios.
5. Add proper automated fatigue deload proposals with coach/athlete review and evidence of benefit.
6. Maintain an evidence audit with version and rationale for every rule change.

## Run regression tests
\`\`\`sh
node --check assets/science/evidence-engine.js
node science/engine.test.js
\`\`\`
