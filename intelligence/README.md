# SpartanX Intelligence — Athlete Dashboard (v0.1)

A standalone, static, zero-dependency prototype of **SpartanX Intelligence** and the **Athlete Dashboard** as a single system.

## Open it
- Live: https://s5vnnvbdzz-coder.github.io/SpartX/intelligence/
- Source: [index.html](./index.html)

This is an independent app in the \`intelligence/\` directory. It does **not** modify the original SpartanX root app, read the SpartanX database automatically, or write any data to SpartanX.

## Included in v0.1
- Four responsive pages: Athlete Overview, Performance, Muscle Workload and Intelligence.
- Three deterministic fictional demo athletes (strength, hypertrophy and foundation).
- 30-day, 90-day and all-time analysis.
- Estimated 1RM trends (Epley formula), last/best strength, 30-day training tonnage, frequency and consistency.
- Rule-based progressive-overload suggestions for squat, bench press, deadlift and overhead press using completed working sets and recent RPE.
- Editable strength goals saved **only for demo profiles** in this app's own \`sx_intelligence_demo_goals_v1\` localStorage key.
- Seven-day primary-muscle working set distribution; no misleading "recovery %" claims.
- Optional manual **read-only local JSON preview** from a workout export. File contents are parsed on-device and remain in memory until reload; never sent to a server.

## Files
- \`index.html\` — UI structure and accessible controls
- \`styles.css\` — responsive Blackout Yellow styling
- \`engine.js\` — pure-ish training calculations, canonical exercise mapping and demo history
- \`app.js\` — UI state, navigation, charts, demo switching, local import and goals
- \`tests.js\` — minimal regression tests for calculations and import validation

## Future integration contract
SpartanX currently stores workout data in the local browser key \`spartx_db\` in a structure with \`sessions[].{id,date,duration,name,exercises[]}\` and \`exercises[].{name,sets[]}\`. A completed set contains \`weight\` (kg), \`reps\`, optional \`rpe\`, \`type\` and \`done\`.

When users explicitly opt in to connecting their data:
1. Read existing SpartanX storage **without modifying or removing it**.
2. Pass a safe subset of completed sessions through \`SXEngine.normalizeSessions(sessions)\`.
3. Keep original session IDs/dates for deduplication, map exercise aliases, and validate weights/reps/RPE.
4. Compute insights in the Intelligence module; do **not** write recommendations back to workouts automatically.
5. Add Nutrition Labs and linked AscensionX adapters later, keeping each source separate until consent and data mapping are tested.
6. If cloud accounts are added later, explicitly design permissions, retention, exports and backups before syncing.

A manual JSON import exists only to test parsing and analytics; it is **not** a live sync feature.

## Limitations
- The preview is neither a medical service nor an autonomous coach. Estimated 1RM values are based on 1–12 rep working sets, not verified lifts.
- Load suggestions are based on very limited signals and need human judgement. They cannot account for injuries, pain, sleep, velocity, technique or fatigue.
- Muscle counts attribute a set to the exercise's *primary* muscle only. This isn't a complete biomechanical model.
- Demo goals are stored locally in the Intelligence app only. Imported workouts remain in memory, not persistent storage.
- All training data shown by default is fictional.

## Test
\`\`\`bash
node intelligence/tests.js
node --check intelligence/engine.js
node --check intelligence/app.js
\`\`\`

## Theme standard
Every new SpartanX Intelligence theme must apply across every page, modal, chart, navigation, interactive control and mobile layout. When eventually embedded in SpartanX, the host's selected theme should be mapped through shared design tokens; don't hardcode one page at a time.
