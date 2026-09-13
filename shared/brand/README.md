# VisaMesa brand assets

Source-of-truth SVGs for the VisaMesa mark, logotype, and lockup.

| File | Use |
|------|-----|
| `logo.svg` | Mark only — favicon, app icon source, schema.org logo |
| `logotype.svg` | Wordmark only — site header (beside mark) |
| `logo-lockup.svg` | Combined mark + wordmark — social/print when a single asset fits |

## Sync (run after changing any SVG)

From `visamesa-root`:

```bash
node scripts/sync-brand-assets.mjs
```

This copies SVGs to `visamesa_fe/public/`, regenerates `favicon.svg`, exports `apple-touch-icon.png`, mobile `logotype.png`, and native app launcher icons.

| Export | Source | Notes |
|--------|--------|-------|
| `apps/mobile/assets/brand/logo.png` | `logo.svg` | Wide mark PNG for in-app `BrandLogo` |
| iOS / Android launcher icons | `logo.png` | Composed square (white bg, padded mark) via `generate-app-icons.mjs` |

## Manual inputs

| Asset | Location |
|-------|----------|
| `og-image.png` (1200×630) | `visamesa_fe/public/og-image.png` (export from lockup) |

Web header uses **mark + logotype side by side** (not the lockup) for readability.
