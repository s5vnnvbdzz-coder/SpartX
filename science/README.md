# Spartan Intelligence — Unified Scientific Programming Engine

**Version 0.2.** This is a developing evidence-informed training decision system; it is not a validated personal optimal-programme predictor.

## Where the engine lives

**Spartan Intelligence** is the home of the shared programming policy. The former standalone \`/science/\` laboratory redirects to \`/intelligence/\`. The separate Science Lab Workout card and top-bar link are removed.

Inside existing **Intelligence → Insights**, the unified volume panel now reads (when available in the same browser):
- Active **5/3/1** saved cycles, individual lift/week main work and BBB 5×10 work.
- Active **AscensionX** lifts and their individual weeks, without assuming the exact number of programmed main working sets.
- Active **bespoke bodybuilding/strength & size** plan and its authored exercise sets.
- Last seven days' **saved, checked working sets** from \`spartx_db\`, excluding warmups, unchecked sets and non-resistance sets.

The output is **read-only**, with conservative assistance suggestions for 5/3/1 and explicit overlap warnings when multiple cycles are detected.

## Working-set policy

Core implementation: \`assets/science/volume-intelligence.js\`.

1. Count weekly **direct working sets** plus **0.5 × indirect working sets** as a transparent, imperfect exposure proxy.
2. Determine initial exposure *bands* by goal and athlete experience; these are not precise evidence-validated biological optima.
3. Protect pre-existing 5/3/1 sets, BBB, and AscensionX **main lift** progression.
4. Review **accessory sets** with consideration for unfilled weekly exposure, remaining exercise slots, axial fatigue, and recovery weeks. Avoid reflexively adding sets when target muscles already receive substantial exposure.
5. A programme-builder draft may use 2, 3 or 4 accessory sets (and 1 in designated recovery contexts), rather than a blanket 2-set rule.
6. Never count warmups as working sets. BBB is not a warmup.
7. Only a new programme draft or an explicit **Intelligence: Review Working Sets** action changes an editable bespoke plan. The athlete must save the draft.
8. AscensionX Adaptive Programming evaluates *optional accessory* doses using the shared policy while retaining its existing taper; **the competition lift prescription, stored cycle and workout history are not overwritten**.

For all goal modes, initial set bands are heuristics. The scientific literature supports dose-response with diminishing returns, NOT a single universally optimal count or a validated exercise-level stimulus/fatigue number. Individual performance, recovery and technique are still required to calibrate recommendations.

## Evidence anchors

- ACSM 2026 resistance training position stand — https://pubmed.ncbi.nlm.nih.gov/41843416/
- Pelland et al. 2026 volume/frequency and fractional working-set dose response — https://pubmed.ncbi.nlm.nih.gov/41343037/
- Robinson et al. 2024 proximity to failure — https://pubmed.ncbi.nlm.nih.gov/38970765/
- 2023 network meta-analysis of exercise prescription for strength/hypertrophy — https://pubmed.ncbi.nlm.nih.gov/37414459/

## Implementation files

- \`assets/science/evidence-engine.js\` — Phase 2 reference research and candidate programme rules (internal).
- \`assets/science/volume-intelligence.js\` — shared weekly exposure and assistance set policy.
- \`intelligence/scientific-panel.js\` — inline interface inside the existing Intelligence Insights tab.
- \`assets/bodybuilding/programme-model.js\` — use policy for new editable bespoke drafts.
- \`assets/bodybuilding/programme-builder.js\` — user-approved reallocation in the existing editor.
- \`assets/ascension/adaptive-programming.js\` — adaptive accessory-dose consultation; do not change main-lift programming.

## Limitations and next steps

- **5/3/1:** main sets and BBB are accounted for, with reviewable accessory suggestions in Intelligence. They are not yet inserted into a workout without athlete approval.
- **AscensionX:** exact upcoming main-lift set counts are owned by AscensionX; internal planning uses a proxy for accessory decisions and must not be described as measured or definitive.
- **Bespoke:** initial working sets are adaptive to the weekly split, but progressive overload still uses the existing linked-workout engine. Future development must unify historical logs for all goal modes, improve exercise taxonomy, link recovery and performance trends, and add complete weekly programming validation.
- Storage remains local per browsing context, not synchronised across devices.
- No Pro gating, billing or coach platform is introduced in this phase.

## Tests

\`\`\`sh
node science/engine.test.js
node science/volume-intelligence.test.js
\`\`\`
