# VisaMesa Project Status

Last updated: 2026-10-10

Purpose: track what has been completed, touched, verified, and what remains. Update this file at the end of each task branch.

## Branching Rules

- Work from latest `main`.
- Use one branch per task.
- Keep unrelated changes out of each branch.
- Before starting a task:
  - `git switch main`
  - `git pull --ff-only`
  - `git switch -c <task-branch>`
- Before PR:
  - run relevant tests
  - update this file if the task changes project status

## Current Main Status

- PR #84 merged: Modelo 790 Code 012 mobile automation.
- PR #112 merged: wrong-captcha retry detection and same-URL reload reinjection/hide behavior.
- Current `main` includes the repeated wrong-captcha fix.

## Completed Work

### WebView automation foundation

Status: Done

Touched:

- `apps/mobile/src/webViewInjection/useWebViewInjection.ts`
- `apps/mobile/src/webViewInjection/scriptRegistry.ts`
- `apps/mobile/src/webViewInjection/useWebsiteWebViewScreen.ts`
- `apps/mobile/src/webViewInjection/screens/WebsiteWebViewScreen.tsx`

Notes:

- Injection is readiness/event-driven.
- Modelo 790 can reinject on same-URL reloads.
- Modelo 790 WebView is hidden during load/reload until captcha-only overlay is ready.

### Modelo 790 Code 012

Status: Merged, needs final post-merge device verification

Touched:

- `apps/mobile/src/scripts/modelo-790-012/config.ts`
- `apps/mobile/src/scripts/modelo-790-012/fillForm.js`
- `apps/mobile/src/scripts/modelo-790-012/index.ts`
- `apps/mobile/src/scripts/modelo-790-012/initialPage.js`
- `apps/mobile/src/scripts/modelo-790-012/mapProfile.ts`
- `apps/mobile/src/scripts/modelo-790-012/messages.ts`
- `apps/mobile/src/webViewInjection/useWebsiteWebViewScreen.ts`
- `apps/mobile/src/webViewInjection/screens/WebsiteWebViewScreen.tsx`

Verified before merge:

- Official form fill path worked.
- Correct captcha produced PDF handoff.
- Native/system PDF viewer opened.
- Completion happened after successful PDF handoff.
- Status overlay hides government page before captcha.
- Wrong-captcha retry was patched and PR #112 merged.

Still verify after latest main:

- Wrong captcha 4+ times never leaves raw government page visible.
- Correct captcha still opens PDF.
- `modelo-790-form` remains incomplete after wrong captcha.
- `modelo-790-form` completes after successful PDF handoff.

### Phone normalization

Status: Done

Touched:

- `apps/mobile/src/features/forms/utils/phoneUtils.ts`
- `apps/mobile/src/features/forms/utils/phoneUtils.test.ts`
- `apps/mobile/src/features/profile/hooks/useProfile.ts`
- `apps/mobile/src/features/profile/hooks/useProfile.test.ts`
- `apps/mobile/src/scripts/modelo-790-012/mapProfile.ts`
- `apps/mobile/src/scripts/modelo-790-012/mapProfile.test.ts`

Notes:

- Stores phone as normalized object.
- Handles legacy compact Spanish phone strings.

### Android debug API setup

Status: Done

Touched:

- `apps/mobile/src/config/resolveApiBaseUrl.ts`
- `apps/mobile/src/config/resolveApiBaseUrl.test.ts`

Notes:

- Android debug uses `http://localhost:3000` via `adb reverse tcp:3000 tcp:3000`.
- Release uses `https://api.visamesa.com`.

### EX-17 native PDF opening

Status: Done, needs regression smoke after Modelo 790 merges

Touched:

- `apps/mobile/src/features/pdfGeneration/forms/ex17/ex17PdfService.ts`
- `apps/mobile/src/features/pdfGeneration/services/pdfFileService.ts`
- Android/iOS native PDF viewer files

## Active / Pending Tasks

### 1. Post-merge Modelo 790 repeated wrong-captcha validation

Status: Completed on device

Verified by user 2026-10-10:

- User entered wrong captcha more than 4 times.
- Retry flow continued to work.
- Fresh build was not required for this validation.

Earlier agent context:

- Latest `main` is built and checked.
- ADB install of fresh debug APK was blocked by device policy: `INSTALL_FAILED_USER_RESTRICTED`.

Goal:

- On latest `main`, verify wrong captcha 4+ times does not expose government page.

Commands / setup:

```bash
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
```

If it fails, capture:

```bash
mkdir -p /tmp/modelo790-debug
adb shell screencap -p /sdcard/modelo790-current.png
adb pull /sdcard/modelo790-current.png /tmp/modelo790-debug/modelo790-current.png
adb logcat -d -s ReactNativeJS:V AndroidRuntime:E chromium:I chromium:E | tail -300 > /tmp/modelo790-debug/logcat-current.txt
```

Expected:

- Native status screen or focused captcha overlay only.
- No raw official page visible.
- Retry message shown after wrong captcha.
- Captcha image refreshed.
- No PDF handoff.

### 2. Final Modelo 790 happy-path verification

Status: Pending manual captcha/device confirmation

Latest attempt 2026-10-10:

- Latest `main` passes automated checks and Android debug build.
- Correct-captcha PDF path requires user captcha entry and cannot be completed by the agent alone.

Goal:

- Correct captcha opens native/system PDF viewer.
- User can save locally.
- Requirement completes only after PDF handoff.

### 3. Restore or keep local test progress override

Status: Backup inspected; pending user decision

Known backup:

```text
/tmp/visamesa-step3-backup-jOD4yZ/snapshot.json
```

Backup summary, inspected 2026-10-10 without printing user identifiers:

- `currentStepId`: 3
- Step 1 completed
- Step 2 completed
- Step 3 not started, `appointment-confirmation` pending
- Step 4 not started, all fee requirements pending
- Step 5 not started
- Step 6 not started

Do not restore unless user asks.

### 4. Full mobile regression suite

Status: Baseline checks passed on `main` after PR #112; repeat after future code changes

Verified 2026-10-10:

- `npm run type-check` passed.
- `npm run lint` passed.
- `npm test -- --runInBand` passed: 92 suites / 380 tests.
- `./gradlew assembleDebug` passed.

Commands:

```bash
cd apps/mobile
npm run type-check
npm run lint
npm test -- --runInBand
cd android
./gradlew assembleDebug
```

### 5. Step 4 / payment checklist UX review

Status: Initial audit complete; no code change made

Findings 2026-10-10:

- Manifest structure is coherent: `modelo-790-form` → `print-modelo-790` → `pay-at-bank` → `fee-payment-receipt`.
- Step 5 `modelo-790-receipt` references Step 4 `fee-payment-receipt`.
- Content clearly separates generating/downloading Modelo 790 from printing, paying at a bank, and keeping stamped receipt.
- No obvious dependency bug found in static audit.

Review files:

- `apps/mobile/src/features/dashboard/data/dashboardContent.ts`
- `apps/mobile/src/features/dashboard/components/RequirementItem.tsx`
- `apps/mobile/src/features/dashboard/components/RequirementsChecklist.tsx`
- `apps/mobile/src/features/dashboard/screens/DashboardStepDetailScreen.tsx`
- `apps/mobile/src/features/dashboard/hooks/useDashboardScreen.ts`
- `apps/mobile/src/features/dashboard/utils/requirementDependencies.ts`

Questions:

- Does user need an explicit paid-fee confirmation separate from generating Modelo 790?
- Are requirements/prerequisites clear?
- Does dashboard refresh after PDF viewer returns?

### 6. EX-17 PDF regression smoke

Status: Focused automated checks passed; device smoke still pending if desired

Verified 2026-10-10:

- `ex17PdfService.test.ts` passed.
- `mapProfileToEx17Data.test.ts` passed.
- `ex17ProfileToPdf.integration.test.ts` passed.

Goal:

- Confirm shared PDF/native opening changes did not regress EX-17.

### 7. Local backend / Google auth dev setup check

Status: Baseline checked 2026-10-10

Known issue:

- Local sign-in 500 previously caused by stopped Postgres container, not Google credentials.

Findings 2026-10-10:

- Backend root health route responded 200 at `http://localhost:3000/`.
- `GET /health` and `/api/health` are not valid routes for this backend.
- `visamesa_be_postgres_1` was running.
- ADB reverse was configured for `3000`, `8081`, and `5173`.

Check:

```bash
curl -i http://localhost:3000/
podman ps | grep postgres
adb reverse --list
```

### 8. Worktree / branch cleanup

Status: Completed for old Modelo 790 worktree and merged local/remote branches

Completed 2026-10-10:

- Removed old clean worktree `/home/gs-44/projects/visamesa-modelo-790-pr84`.
- Deleted local merged hotfix/feature/stack branches where present.
- Deleted remote stacked branches after their content landed on `main`.

Known worktrees:

- `/home/gs-44/projects/visamesa-root`

The old `/home/gs-44/projects/visamesa-modelo-790-pr84` worktree was removed after its changes landed on `main`.

### 9. iOS validation

Status: Blocked on Linux

Needs macOS/CocoaPods.

### 10. Documentation / release notes

Status: Completed and merged

Touched:

- `apps/mobile/README.md`

Added notes:

- Physical Android debug device requires ADB reverse for backend/Metro/website.
- Backend health check is `http://localhost:3000/`.
- Modelo 790 uses the official captcha entered by user.
- Raw official page should stay hidden except focused captcha UI.
- PDFs open in native/system viewer; user should save locally.

### 11. Empadronamiento cookie and Spanish phone handling

Status: Cookie/country-code fix merged in PR #119; stricter Spanish-number validation merged in PR #120; device verification pending

Goal:

- Dismiss cookie consent reliably, including banners rendered after the main page content.
- Send only the Spanish national phone number to the Barcelona appointment form, without `+34` or country-code formatting.

Touched:

- `apps/mobile/src/scripts/bookingAssistantProfile.ts`
- `apps/mobile/src/scripts/bookingAssistantProfile.test.ts`
- `apps/mobile/src/scripts/empadronamiento/cookie-consent.js`
- `apps/mobile/src/scripts/empadronamiento/index.ts`
- `apps/mobile/src/scripts/empadronamiento/index.test.ts`
- `apps/mobile/src/scripts/empadronamiento/initia.js`

### 12. Empadronamiento native status and final confirmation

Status: In progress on branch `feat/empadronamiento-native-status-confirmation`

Goal:

- Keep the official WebView hidden behind native progress/status UI.
- Capture the selected office, date, and time during automation.
- Show a native appointment review screen before official submission.
- Submit only after explicit user confirmation.
- Mark the dashboard requirement complete only after the official site confirms the booking.

Touched:

- `apps/mobile/src/scripts/empadronamiento/{select-oficina.js,select-date.js,select-time.js,submit-final.js,index.ts,index.test.ts,messages.ts,messages.test.ts}`
- `apps/mobile/src/webViewInjection/useWebsiteWebViewScreen.ts`
- `apps/mobile/src/webViewInjection/screens/WebsiteWebViewScreen.tsx`
- `apps/mobile/src/navigation/types.ts`
- `apps/mobile/src/features/dashboard/hooks/useDashboardScreen.ts`
- `apps/mobile/src/features/dashboard/hooks/useDashboardScreen.test.ts`
- `shared/content/locales/{en,es,zh}/common.json`

## Recent Task Log

### 2026-10-10 — Sync main after PR #112

- User merged PR #112 and deleted branch.
- Checked out `main`.
- Pulled latest `origin/main` fast-forward to include PR #112.
- Created `chore/project-status-tracker` branch.
- Added this status file.

### 2026-10-10 — Post-merge baseline checks

- On latest `main`, ran focused Modelo 790/WebView injection tests: passed.
- Ran mobile type-check: passed.
- Ran mobile lint: passed.
- Ran full mobile Jest suite: 92 suites / 380 tests passed.
- Ran Android debug build: `./gradlew assembleDebug` passed.
- Audited Step 4 checklist dependencies/content; no code change needed from static review.
- Checked local backend/dev auth prerequisites: backend root `/` returned 200, Postgres container running, ADB reverse active for 3000/8081/5173.

### 2026-10-10 — Mobile dev setup docs

- Started stacked branch `docs/mobile-dev-setup-notes` on top of `chore/project-status-tracker`.
- Added README notes for Android physical-device ADB reverse, backend root health check, and Modelo 790/PDF invariants.
- Ran shared content tests: 18 files / 64 tests passed.
- Ran focused EX-17 PDF tests: 3 suites / 12 tests passed.
- Inspected local progress backup shape without modifying data; restore remains pending user decision.

### 2026-10-10 — WebView reinjection test coverage

- Started stacked branch `test/webview-same-url-reinject` on top of `docs/mobile-dev-setup-notes`.
- Added coverage proving `reinjectOnLoadEnd` rules re-run readiness and page script injection after same-URL loads.
- Ran `useWebViewInjection.test.tsx`: 9 tests passed.
- Ran mobile type-check: passed.

### 2026-10-10 — Landed stacked follow-ups and cleanup

- Merged status/docs/test follow-ups into `main`.
- Because stacked PRs #114/#115 were originally based on stack branches, created and merged PR #116 to ensure docs/test changes landed on `main`.
- Removed old Modelo 790 worktree and merged branches.
- Final checks on `main` passed: type-check, lint, full mobile Jest (92 suites / 381 tests), Android debug build.
- Attempted device install/launch; install blocked by device policy (`INSTALL_FAILED_USER_RESTRICTED`), existing app JS started but device screenshot stayed black.
- User later verified the repeated wrong-captcha flow on device: more than 4 wrong captcha attempts stayed retryable.

### 2026-10-24 — Empadronamiento cookie and phone fixes

- Started branch `fix/empadronamiento-cookie-spanish-phone` from latest `main`.
- Changed empadronamiento profile mapping to use only the normalized national phone number.
- Added cookie-consent handling to every empadronamiento automation step.
- Cookie handling supports common consent-manager selectors, Catalan/Spanish/English accept-all labels, and late-rendered banners via `MutationObserver`.
- PR #119 merged the cookie handling and removal of `+34` from the submitted phone value.
- PR #120 added a guard so empadronamiento readiness requires an actual Spanish `+34` number with a valid 9-digit national format.
- Left unrelated pre-existing untracked files untouched.

### 2026-10-24 — Empadronamiento native status and review gate

- Confirmed the previous final-submit script existed but auto-submitted immediately.
- Replaced auto-submit with a WebView-to-native review-ready message.
- Added selection messages and session storage fallbacks for office/date/time.
- Added a native hidden-WebView status flow and appointment review card.
- Added explicit native confirmation that injects the official submit click only after user approval.
- Added official success detection and progress completion with appointment details.
- Device logs and Chrome WebView inspection showed the real office route uses radio inputs named `oficinas` with IDs such as `OAC-CV`, not the stale `#OAC-DR` selector; the continue control is an `input[type="submit"]`/`Següent` button. Updated selectors and verified the office step on-device.
- Removed the temporary translucent debugging styles after successful device verification; empadronamiento WebView is hidden again during automation.
- Added trusted-host checks, terminal error UI, and safe programmatic exit handling.

## Do Not Forget

- Never bypass captcha.
- Never leave raw government page visible in Modelo 790 automation.
- Keep branches small and task-focused.
- Update this file after each task.
