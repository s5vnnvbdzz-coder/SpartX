# SpartanX Cloud — opt-in training backup (stage 1)

**Status:** Prototype on a feature branch. No live cloud service is connected yet. This is not full multi-device sync or ChatGPT integration.

The existing SpartanX and AscensionX data remain on the user's device. This feature only **uploads an athlete-approved training subset** to a separate, private Supabase project:

- `spartx_sessions` — completed workout sessions, exercises, completed sets, relevant programme links and any logged workout notes.
- `ascensionx_training` — AscensionX cycle, saved lifting logs, training-max values and programme settings.

The code intentionally excludes profile photos, birth date, following/followers, measurements, nutrition, active drafts and account settings. No data is transmitted until the athlete signs in and explicitly clicks **Back up training** or enables **Automatic backups**. Automatic backups run while an app page is open; iOS does not guarantee background execution. The source device remains the authority for its own records; no server records are automatically imported into local storage.

## Admin setup

1. Create a private Supabase project at https://supabase.com.
2. Run `schema.sql` in the Supabase SQL editor, and confirm the three row-level security policies and the table grants.
3. Enable Email OTP (passwordless sign-in) in **Authentication**. In the email template use `{{ .Token }}` so the user can enter the code in the *installed iPhone app*, instead of relying on a browser-opening magic link.
4. Put the **Project URL** and **publishable** `sb_publishable_...` key in `config.js`. Those two values are designed to be public in client applications. Never commit a Supabase secret key, service-role key or password.
5. Test in a throwaway Supabase account, then merge/deploy the feature branch only after validating backups in the user's iPhone PWA context.

## Operating it

Open SpartanX **Profile → Settings → Cloud training backup**. This reads both workout history and the embedded AscensionX data stored in the same browser/PWA origin. There is no need to open or export from standalone AscensionX.

- Request a login code by email and enter it in the same app.
- Tap **Back up training** to upload the training-only records currently present in that browser/PWA context.
- Optionally enable **Automatic backups**. Only changed data is uploaded, while the page is open and connected.
- Use **Download cloud copy** to save a read-only JSON archive; this never modifies the on-device workout database.
- Sign out to revoke local participation in automatic uploads.

The file `spartanx-backup.json` does not include all AscensionX data, and `ascensionx-backup.json` does not include SpartanX's workout database. Preserve the original two manual backups until cloud data has been inspected.

## Security and data-integrity limits

- Supabase authentication controls the user; RLS policies control which rows a browser may read/update. The publishable key is not a password.
- Snapshot keys are per `user_id + device_id + dataset`. Different devices never overwrite one another, but **this does not merge sessions, sync edits, or resolve conflicts**. Restoring data requires a separately reviewed process.
- The cloud archive retains the latest *training-only snapshot* per device, not a full versioned backup or undo history.
- Browser local storage is vulnerable to device/browser data loss and to cross-site scripting. Do not deploy until authentication, input handling and RLS have been tested.
- The `Download cloud copy` feature exports a JSON file; it does **not** send it to ChatGPT or Google Drive. A separate restricted, consented read-only integration is required for that.
- The GitHub source repository is public. Never commit user workout JSON or any secret.
