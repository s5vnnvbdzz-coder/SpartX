# SpartanX Intelligence — Athlete Dashboard

A standalone, static, zero-dependency prototype of **SpartanX Intelligence** and the **Athlete Dashboard** as a single system.

## Open it
- Live: https://s5vnnvbdzz-coder.github.io/SpartX/intelligence/
- Source: [index.html](./index.html)

This is an independent app in the \`intelligence/\` directory. The original SpartanX workout logger remains the only place users log workouts. This module now **automatically reads** saved completed sessions from the same-origin browser storage key `spartx_db` on launch and when the app returns to the foreground. It never modifies existing workout records. If browser storage is separate (e.g. iPhone Safari versus Home Screen app), it shows a clear no-connection state rather than fictional results.

## Live Session upgrade (November 2026)

SpartanX Intelligence now reads **completed sets in an active workout** from the existing same-origin autosaved draft `spartx_draft_v1`, in addition to reading saved training history from `spartx_db`.

- A provisional Live Session panel appears during an active workout in the same browser/PWA storage context.
- Only checked, valid resistance sets contribute. Warm-ups count towards total volume, but not working-set estimated strength.
- Each selected exercise shows completed sets, working volume, top-set estimated 1RM, comparison with the last saved session, logged RPE, effort signals and cautious progression guidance.
- The current draft is **never added to saved historical graphs or permanent records** until Finish & Save.
- Discarded workouts disappear from the live panel; editing an old saved workout is explicitly excluded.
- This is read-only and local. No data is transmitted, and separate iPhone Safari and Home Screen storage contexts may not share workouts.

Run `node intelligence/live.test.js` to check live-set filtering, history isolation and RPE-based advice. The relevant modules are `bridge.js`, `live.js` and `app.js`.

## Included in v0.1
- Four responsive pages: Athlete Overview, Performance, Muscle Workload and Intelligence.
- Three deterministic fictional demo athletes (strength, hypertrophy and foundation).
- 30-day, 90-day and all-time analysis.
- Estimated 1RM trends (Epley formula), last/best strength, 30-day training tonnage, frequency and consistency.
- Rule-based progressive-overload suggestions for squat, bench press, deadlift and overhead press using completed working sets and recent RPE.
- Editable strength goals saved **only for demo profiles** in this app's own \`sx_intelligence_demo_goals_v1\` localStorage key.
- Seven-day primary-muscle working set distribution; no misleading "recovery %" claims.
- **Automatic read-only SpartanX workout connection** when opened from the same browser or installed PWA context. Home has an Intelligence launch card. Reconnect and refresh controls are also provided.
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

Automatic local reading is available now, but this is **not** cloud sync or account-wide synchronization. The source database stays on the device. The manual JSON import remains a fallback for contexts that do not share local storage.

## Limitations
- The preview is neither a medical service nor an autonomous coach. Estimated 1RM values are based on 1–12 rep working sets, not verified lifts.
- Load suggestions are based on very limited signals and need human judgement. They cannot account for injuries, pain, sleep, velocity, technique or fatigue.
- Muscle counts attribute a set to the exercise's *primary* muscle only. This isn't a complete biomechanical model.
- Demo goals are stored under `sx_intelligence_demo_goals_v1` and linked-user goals under `sx_intelligence_linked_goals_v1`. Neither key is part of the original SpartanX workout database. Imported workouts remain in memory, not persistent storage.
- Fictional demo data is used only when demonstration mode is explicitly selected; connected SpartanX training data is not replaced with fictional sessions.

## Test
\`\`\`bash
node intelligence/tests.js
node intelligence/bridge.test.js
node --check intelligence/engine.js
node --check intelligence/app.js
node --check intelligence/bridge.js
\`\`\`

## Data safety and same-device behaviour
- Reading workouts requires no duplicate logging, manual export or second workout entry when the two pages share a browser storage context.
- The adapter never calls `setItem`, `removeItem`, `clear`, or sends data over the network. It reads only completed sessions and a profile display name.
- No records found, storage blocked, malformed JSON or isolated Home Screen storage shows an honest empty/error state; automatic demo substitution is forbidden.
- Refresh manually from the source menu or return to Intelligence after saving a SpartanX workout to re-analyse.
- Browser data can be lost by clearing website storage. SpartanX backups are still important.

## Theme standard
Every new SpartanX Intelligence theme must apply across every page, modal, chart, navigation, interactive control and mobile layout. When eventually embedded in SpartanX, the host's selected theme should be mapped through shared design tokens; don't hardcode one page at a time.
