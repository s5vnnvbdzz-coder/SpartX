# AscensionX 2.0 — isolated programming preview

This branch introduces a non-destructive 8/12/16-week powerlifting planner. It does not replace the live six-week cycle, write local storage, or import workouts. The prototype supports 3–4 days chosen from availability, recent verified 1RMs in kilograms, conservative recovery flags, equipment and time constraints, secondary lift exposure, scheduled recovery phases, and submaximal assessment. Shared volume intelligence is consulted in the browser. The exact thresholds and percentages are heuristics, not demonstrated optimal programming.

Open `AscensionX/programme-preview.html` on a local static server, or follow the preview link from the cycle editor. Run `node assets/ascension/programming-v2.test.js` for deterministic checks. Next: browser and integration tests, data versioning, historical loads, approval-controlled workout import, completion state and full adaptation, profile persistence, mobile and offline support. Do not merge/deploy as a finished engine without review.

Evidence: https://pubmed.ncbi.nlm.nih.gov/41843416/ and https://pubmed.ncbi.nlm.nih.gov/32917000/; existing shared science library documents fractional exposure and its limitations.

## Preview 2

Explicit local saved-programme support, next-session progression derived from original SpartanX saved sets, and a first-party workout handoff. A legacy AscensionX cycle or active workout blocks import. No automatic overwriting of legacy cycles. The next session is complete only when all prescribed working set IDs appear in one saved workout with valid logged reps; partial saves do not advance. Repeated comparable RPE observations inform conservative load suggestions; missing RPE never triggers automatic progression. Three sets are the ordinary accessory starting baseline, with lower doses for high exposure, recovery phases or limited time. These changes require browser, mobile, sync, and regression testing before deployment.

## Preview 3

Optional reported sticking points influence secondary squat and bench selection; deadlift cues and limited hinge support are not a muscle diagnosis. Adaptive volume trials at most one change per session; snapshots preserve the exact approved prescription and completion identifiers. Live back-down review changes only unchecked prescribed sets after explicit confirmation. Completed assessment singles with RPE 7–9 inform bounded estimated baselines; athlete approval and regeneration required. Cross-device programme state is not yet synced; the preview remains branch-only.
