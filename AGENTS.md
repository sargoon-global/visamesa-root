# Agent instructions

This is the only agent instruction file in this repository. Do not add `CLAUDE.md`. Claude Code reads `AGENTS.md` when no `CLAUDE.md` is present, and reads only `CLAUDE.md` if both exist.

Read [README.md](README.md), then [apps/mobile/README.md](apps/mobile/README.md), before changing the app.

Shared copy and types live under `shared/`. API behavior lives in `visamesa_be`. Company limits live in `sargoon-global/visamesa-os`.

## Keep the docs true

When a change makes a sentence in [README.md](README.md) or [apps/mobile/README.md](apps/mobile/README.md) false, update that sentence in the same change. Do not add a plan, session note, or status log. Do not pin dependency versions in the README. `apps/mobile/package.json` is the version source.

If the change affects what the app does on the device, what it uploads, or shared customer-facing wording, also update `docs/product.md` in `visamesa-os` when that repo is checked out. Otherwise say so in the pull request.

## Git

- Never push `main`. Use a branch and a pull request.
- GitHub branch protection blocks direct pushes to `main` on this repository. In each clone, run once: `git config core.hooksPath .githooks` as a backup before the remote rejects the push.

## Boundaries

- Booking assistance runs on the phone, in a WebView. Do not move it onto the server.
- Applicant identity fields are encrypted on the device before upload. Do not log or commit decrypted profiles.
- The government-endorsement disclaimer is [STORE_LISTING_DISCLAIMER.md](STORE_LISTING_DISCLAIMER.md). Do not shorten it.
- `apps/mobile/package.json` requires Node `>= 22.11.0`. CI installs Node 24. Leave both as they are.
- Do not deploy or push `main`.
