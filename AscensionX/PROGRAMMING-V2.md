# AscensionX 2.0 — isolated programming preview

This branch introduces a non-destructive 8/12/16-week powerlifting planner. It does not replace the live six-week cycle, write local storage, or import workouts. The prototype supports 3–4 days chosen from availability, recent verified 1RMs in kilograms, conservative recovery flags, equipment and time constraints, secondary lift exposure, scheduled recovery phases, and submaximal assessment. Shared volume intelligence is consulted in the browser. The exact thresholds and percentages are heuristics, not demonstrated optimal programming.

Open `AscensionX/programme-preview.html` on a local static server, or follow the preview link from the cycle editor. Run `node assets/ascension/programming-v2.test.js` for deterministic checks. Next: browser and integration tests, data versioning, historical loads, approval-controlled workout import, completion state and full adaptation, profile persistence, mobile and offline support. Do not merge/deploy as a finished engine without review.

Evidence: https://pubmed.ncbi.nlm.nih.gov/41843416/ and https://pubmed.ncbi.nlm.nih.gov/32917000/; existing shared science library documents fractional exposure and its limitations.
