# VisaMesa Mobile (`visamesa-root`)

React Native monorepo for the VisaMesa mobile app and shared packages. On-device WebView booking assistants run on the user's phone to avoid government website blocking.

## Repository Structure

```
visamesa-root/
├── shared/                           # Shared code across packages
│   ├── types/                       # Common TypeScript types
│   ├── content/                     # Shared legal/content copy
│   └── design-tokens/               # Shared design tokens
├── apps/                            # Applications
│   └── mobile/                      # React Native mobile app (@visamesa/mobile)
│       ├── src/                    # App code + WebView booking assistant scripts
│       ├── package.json
│       ├── README.md               # App-specific documentation
│       └── ...
└── README.md                        # This file
```

## Booking assistants

### Mobile app (`apps/mobile`)

Guides users through empadronamiento and cita previa booking on official Spanish government websites.

**Target websites**:

- Cita previa: https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus
- Empadronamiento: Barcelona city online office

**Status**: Infrastructure complete, with a rule-driven injection layer ready for additional page rules/scripts

**Tech stack**: React Native + WebView + JavaScript injection

📖 [View app documentation →](apps/mobile/README.md)

## Architecture

Booking assistants follow the same pattern:

```
User's mobile device (React Native app)
          ↓
    WebView with injected JavaScript
          ↓
    Official booking site (user-initiated, assisted interactions)
          ↓
    Results sent to backend API (visamesa_be)
          ↓
    Mobile app displays status + entitlements
```

### Why on-device WebViews?

- **Avoids IP blocking**: Runs on the user's device, not a server
- **User control**: The user initiates and monitors each booking assistant session
- **Security**: Uses the user's own credentials and network
- **Reliability**: No shared infrastructure to get blocked

## Quick Start

### Running the mobile app

```bash
cd apps/mobile
npm install
npm run ios    # iOS simulator
npm run android    # Android emulator
```

See the app README for detailed setup instructions.

**Payments (Stripe checkout from mobile → website):** [../visamesa_be/docs/LOCAL_PAYMENTS.md](../visamesa_be/docs/LOCAL_PAYMENTS.md)

---

## Prerequisites

- Node.js: `apps/mobile/package.json` requires `>= 22.11.0`. CI installs Node 24. Do not assume Node 18.
- Xcode (iOS development)
- Android Studio (Android development)
- CocoaPods: `sudo gem install cocoapods`
- Running `visamesa_be` backend: `cd visamesa_be && npm run dev`

**Test account**:

- Email: `test@visamesa.com`
- Backend: `http://localhost:3000`

## Shared packages

Import shared code via `@visamesa/content`, `@visamesa/design-tokens`, and `@visamesa/types`.

## How WebView booking assistants work

1. The user opens a booking assistant from the dashboard checklist.
2. The app loads the official site in a WebView and injects profile data the user already saved.
3. JavaScript helpers pre-fill fields and guide the user through the booking flow.
4. The user confirms each submission step on the government site.

## Testing

- Authentication, entitlements, profile completeness, and dashboard progress
- WebView load + injection rules for empadronamiento and cita previa
- End-to-end flow from login through booking assistant launch

## Troubleshooting

### Cannot connect to backend

**iOS Simulator**: `http://localhost:3000`
**Android Emulator**: `http://10.0.2.2:3000`
**Physical device**: `http://YOUR_LOCAL_IP:3000`

### WebView not loading

- Check `javaScriptEnabled={true}`
- Enable `domStorageEnabled={true}`
- Check console logs for errors
- Verify the website is accessible

## License

See [LICENSE](LICENSE) file.
