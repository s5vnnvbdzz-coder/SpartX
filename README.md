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
