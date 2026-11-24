# AscensionX 2.0 — standalone development lab

**Status: dev build 0.3 (assessment UI, not yet a finished coaching product)**

Standalone URL after GitHub Pages deployment: https://s5vnnvbdzz-coder.github.io/SpartX/AscensionX2/

## Athlete-first create flow (24 November 2026)
- Main **Create Cycle** now leads with `assessment.html`: a six-step, mobile-first athlete questionnaire based on the successful earlier four-day StrengthX design.
- Steps: **Goal** (maximum strength or strength + size), **Athlete** (age, experience, bodyweight and height), **Strength** (current SBD records, PR goals and optional weak points), **Recovery** (sleep, job demands, activity, nutrition and readiness), **Training** (available days, sessions/week, duration, cycle length, equipment and load increments), **Review**.
- **Measures is authoritative** for latest recorded bodyweight and (where available) height. Where height is missing, it must be entered explicitly. Classic AscensionX's stored SBD values are offered as editable prefill only. Neither source is written to by 2.0.
- Records are read locally on the same browser origin; 2.0 does not assume the PC and iPhone have synchronised data.
- Automatically suggests a feasible schedule (e.g. Monday/Tuesday/Thursday/Saturday for an unrestricted four-day week); high-recovery-stress athlete inputs can reduce *initial* assistance sets and a balanced focus can choose incline DB pressing.
- Assessment drafts are held under the **separate** `ax2_athlete_assessment_draft_v1` storage key. Creating a programme archives any current standalone 2.0 cycle and **never affects classic AX or SpartanX workout history**.
- Former standalone quick-builder form remains under a collapsible **Legacy Development Form** until the new intake flow is proven.
- This work is the athlete-input **foundation**, not a claim that the full earlier scientific volume/selection engine or automatic future set-by-set programming has been ported. Those remain next milestones.

## Scope

- Independent web app, separate install scope/service worker and own \`localStorage\` key: \`ascensionx2_standalone_workspace_v1\`.
- No iframe. Does not read or write \`ascensionx_strength_v1\`, \`spartx_db\`, \`spartx_draft_v1\`, or any existing SpartanX/AscensionX keys.
- No live workout import or synchronisation. 2.0 plans cannot replace classic six-week cycles by accident.
- Build and save 4, 8 or 12-week PR-first powerlifting blocks, choosing 3/4/5 days; edit known 1RMs, PR goals, recovery, equipment and selectable technique limitations.
- Plans include primary top sets, back-down sets and warm-ups; day 4 secondary squat + bench, with assistance work and appropriate deloads/taper/optional assessment.
- Preview all weeks, record actual top-set weights/repetitions/RPE separately, see load-adjustment review recommendations, archive/restore 2.0 plans, export/import 2.0-only backups.
- On test week, all suggested attempts are **candidates**, not required. No automatic 1RM testing.

## Deliberate limits

- Only top-set logging currently exists; not yet a production set-by-set logger.
- Future programmed top sets are **not automatically rewritten** by RPE suggestions. User feedback and calibration need to precede automatic changes.
- The relative intensity and volume schedule is an initial, testable coaching heuristic, **not** an evidence-validated individual optimiser. Exercise selection and session time estimates require further field testing.
- No native cloud sync; data is browser/device-local. Back up before resetting or changing phones.
- A new PR is a goal, **not a guaranteed result**. A conservative single, technique quality and recovery take priority.
- Current classic six-week AscensionX remains unchanged while 2.0 is evaluated.

## Developer checks

\`node tests/ascensionx2-standalone.test.js\`

Browser smoke: \`node tests/ascensionx2-standalone.browser.cjs\` (requires Playwright browser installation).

Next phases: full exercise-level logging and set type/rpe support; volume/exposure science audits; load prescription adjustment guarded by actual performance; cycle continuation and adaptive recalculations; an isolated cloud sync test environment; future *explicit* integration after the original six-week AscensionX programme is complete and the new engine has been validated.
