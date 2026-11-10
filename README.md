# SpartanX

SpartanX is a workout planner and strength-training tracker.

## Live app

https://s5vnnvbdzz-coder.github.io/SpartX/

## GitHub Pages

This repository publishes the root `index.html` and supporting assets using the GitHub Actions workflow in `.github/workflows/pages.yml`.

To enable the site, open **Settings → Pages** and choose **GitHub Actions** under **Build and deployment → Source**. A push to `main` triggers a fresh deployment. Check the **Actions** tab for deployment status.

## Data

Workout and profile information is stored locally in the user's browser. The current version does not sync user workouts to GitHub or a cloud account; users should regularly export backups.


## Required theme coverage (SpartanX standard)
Any new theme is incomplete until the selected appearance works on **all** SpartanX surfaces. Do not register a theme only in the main page's selector.

- Main app: Home, Workout, Profile, navigation, profile cards, active sessions and popups (`index.html`).
- Tools: shadow-root Tool cards, buttons, header, training calculators, and modal controls (`tools/replica.js`). The Tools host inherits base CSS tokens from the main app, but bespoke components still require review.
- Settings: both the in-app settings modal and standalone Tools settings page (`tools/settings.html`, `assets/themes/spartanx-settings-surface.css`).
- Cycle Planner: independent theme selection and iframe message updates (`tools/531-cycle.html`).
- AscensionX when embedded in SpartanX: mapped parent theme through `assets/themes/spartanx-ascension-embed.css`. Keep standalone AscensionX theme preferences independent.
- For any standalone Tools screens, ensure the shared theme values are read from `spartx_preferences_v1` or from the parent theme.
- Test after switching themes without reload, navigating to each screen, refreshing, opening popups, returning from the planner, and relaunching the iPhone home-screen app.
- Update asset cache query versions for affected CSS and JavaScript so installed PWA clients can receive changes.

Theme tokens: `--bg`, `--panel`, `--panel2`, `--line`, `--txt`, `--muted`, `--lime`. Avoid fixed colours in common components unless deliberately theme-independent.


## SpartanX Intelligence goal modes
The Intelligence dashboard under `/intelligence/` now offers a shared **Training Goal** dropdown with Powerlifting, Bodybuilding, and Weight Loss. The goal-specific dashboards at `/intelligence/goals.html` share the same top header, sidebar/mobile navigation, Overview, Performance, Workload/Consistency, and Insights sections, along with 30-day, 90-day, and all-time trends.

Changing goals only writes the selection to `sx_intelligence_selected_goal_v1`. It **does not modify or delete** `spartx_db`, training history, active workout drafts, 5/3/1 cycles, or AscensionX programming. Bodybuilding targets and weight-management settings remain under `sx_intelligence_goal_settings_v1`; optional weight readings remain under `sx_intelligence_weight_logs_v1`; selected filters and view state are stored separately.

These are browser-local settings and records. Switching from a web browser to an installed iPhone app can present different local storage; users need to use the same origin/browser context or export/import backups. Intelligence supports read-only JSON previews, and the goal-specific demo mode never writes to SpartanX workout records.


## Strength & Bodybuilding programme integration (Stages 1–2)

The Workout page's **Strength & Bodybuilding** card opens a theme-aware programme builder:
create, view, edit and delete 3–6-day plans of 4, 6, 8 or 12 weeks. Saved plans
live in `sx_bodybuilding_programmes_v1` and do not edit AscensionX, 5/3/1,
or completed workout history.

**Continue Training** selects the next outstanding training day in the active
plan (or an explicitly chosen day), asks for confirmation, and loads exercises,
starting weights, minimum reps, working-set counts and rest time into SpartanX's
existing workout logger. The sets start unchecked. Existing active workouts
are never overwritten: the athlete must finish or discard the current session
before starting another.

After **Finish & Save**, SpartanX records a `bodybuildingLink` on the new
workout and on the linked exercises. Programme progress is derived from those
saved workouts, not from a separate mutable counter. A day is marked complete
when all prescribed working sets were logged; partial saves remain outstanding.
The next training week opens only when all days in the current week are complete.
Unrelated workouts and duplicates cannot advance programme progress.

The normal SpartanX workout draft-recovery mechanism retains imported
programme metadata. Subsequent stages will implement adaptive load
recommendations and planned-versus-completed analyses in Intelligence.

**Storage notice:** programme definitions currently use their own browser-local
key and are not part of the legacy `spartx_db` export/import file. Exporting
only the legacy workout database is not a complete programme backup.


## AscensionX Strength & Size Companion (opt-in)

The **Strength & Bodybuilding** builder now offers a six-week **AscensionX
Strength & Size Companion** when a valid AscensionX cycle is available in the
same browser. It discovers **only the lifts the athlete chose** in that cycle,
with individually toggleable Squat, Bench Press, Deadlift and Overhead Press
companions. Enabling it requires explicit user action; the default is **OFF**.

The companion adds optional exercises only to subsequent imported AscensionX
sessions, after the existing paused-bench and Romanian-deadlift accessory
modules. Those two existing prescriptions are **not recreated**. New optional
pairings are: Squat → Leg Press and Seated Leg Curl; Bench → Chest-Supported
Row and Triceps Pushdown; Deadlift → Lat Pulldown and Pallof Press; Overhead
Press → Lateral Raise and Rear Delt Fly. New sets are unchecked, moderate
RIR (approximately 3), and have no `ascensionLink` or AscensionX cycle
completion requirement.

Volume tapers with the selected lift's week (weeks 1–3 normal, week 4
reduced, week 5 only one set of the first accessory, week 6 none). The
athlete can choose **Low** volume or disable any linked lift individually.
The implementation deduplicates exercise names within an active session and
never injects work into a historical workout, a non-AscensionX workout or
an old cycle. User preferences are scoped by cycle ID under
`sx_ascension_companion_v1`. They do not alter `ascensionx_strength_v1`,
`spartx_db` until a normal SpartanX session is explicitly completed, or
5/3/1 programming.

This is a starting prescription and does not guarantee recovery or strength
progression. Planned-versus-actual workload analysis and editable exercise
substitutions are future improvements. The standalone Strength & Size
programme builder remains separate from this cycle-linked companion.

A standalone **Strength & Size** workout is prevented from starting if its training day contains an AscensionX-selected compound lift while a six-week AscensionX cycle is active; the athlete can edit the standalone day to remove overlapping heavy compounds or use the linked companion instead.
