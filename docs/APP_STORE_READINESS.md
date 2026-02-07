# App Store Readiness — Capacitor Integration Reference

> **Created:** February 7, 2026  
> **Status:** Implementation complete, pending native project generation

---

## Overview

The DAD GYM Next.js application has been prepared for Apple App Store and Google Play deployment using **Capacitor**. A dual-build strategy preserves the existing web SSR deployment while enabling static export for native mobile shells.

> **IMPORTANT:** The existing web application is **fully preserved and verified** — `npm run build` passes with zero regressions.

---

## Architecture: Dual-Build Strategy

```
Source Code
    │
    ├── NEXT_PUBLIC_MOBILE=false → SSR Build (npm run build) → Netlify
    │
    └── NEXT_PUBLIC_MOBILE=true  → Static Export (npm run build:mobile) → Capacitor
                                                                            ├── iOS App
                                                                            └── Android App
```

Every server-component page detects `NEXT_PUBLIC_MOBILE` at build time:
- **Web (default):** Dynamic imports of server-only modules → full SSR as before
- **Mobile:** Returns a client component that fetches data via the browser Supabase client

---

## Files Created

### Native Utilities
| File | Purpose |
|------|---------|
| `src/lib/native/platform.ts` | Platform detection (`isNative`, `isIOS`, `isAndroid`, `isWeb`) |
| `src/lib/native/haptics.ts` | Haptic feedback abstraction — no-ops gracefully on web |
| `src/components/native/NativeInit.tsx` | Splash screen, status bar, keyboard, back button init |

### Client-Side Action Mirrors
| File | Mirrors |
|------|---------|
| `src/features/workouts/actions/generateProgram.client.ts` | `generateProgram.ts` |
| `src/features/workouts/actions/computeProgression.client.ts` | `computeProgression.ts` |
| `src/features/workouts/actions/streaksAndPRs.client.ts` | `streaksAndPRs.ts` |

### Client Page Components
| File | Mirrors |
|------|---------|
| `src/app/dashboard/DashboardClient.tsx` | `dashboard/page.tsx` server logic |
| `src/app/progress/ProgressClient.tsx` | `progress/page.tsx` server logic |
| `src/app/settings/SettingsClient.tsx` | `settings/page.tsx` server logic |
| `src/app/workout/[id]/WorkoutClient.tsx` | `workout/[id]/page.tsx` server logic |

### Auth & Config
| File | Purpose |
|------|---------|
| `src/hooks/useAuth.ts` | Client-side auth hook for mobile |
| `capacitor.config.ts` | Capacitor native shell configuration |
| `public/manifest.json` | PWA / Capacitor manifest |

---

## Files Modified

### Page Refactoring
Each page now conditionally renders based on build mode:
- `src/app/dashboard/page.tsx` — Dynamic server imports + mobile fallback
- `src/app/progress/page.tsx` — Dynamic server imports + mobile fallback
- `src/app/settings/page.tsx` — Dynamic server imports + mobile fallback
- `src/app/workout/[id]/page.tsx` — Dynamic server imports + mobile fallback

### Native Experience Integration
- `src/app/layout.tsx` — Added NativeInit, viewportFit: 'cover', disabled zoom
- `src/app/globals.css` — Safe-area padding, keyboard handling, standalone mode
- `src/features/workouts/components/WorkoutRecorder.tsx` — Haptic feedback, platform-aware action imports
- `src/components/ui/Button.tsx` — Haptic impact on press

### Build Configuration
- `next.config.ts` — Conditional `output: 'export'`
- `package.json` — Scripts: `build:mobile`, `cap:sync`, `cap:ios`, `cap:android`

---

## npm Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `next build` | Standard web SSR build |
| `build:mobile` | `NEXT_PUBLIC_MOBILE=true next build` | Static export for Capacitor |
| `cap:sync` | `npx cap sync` | Sync web assets to native projects |
| `cap:ios` | `npx cap open ios` | Open iOS project in Xcode |
| `cap:android` | `npx cap open android` | Open Android project in Android Studio |

---

## Next Steps

1. **Generate app icons** — Create 1024×1024 PNG icons for both platforms

2. **Run the mobile build + Capacitor sync:**
   ```bash
   npm run build:mobile
   npx cap sync
   ```

3. **Open and test in Xcode:**
   ```bash
   npx cap open ios
   ```

4. **Apple Developer Account** — Required for App Store submission:
   - Enroll at developer.apple.com
   - Configure certificates, provisioning profiles, and App ID

5. **Google Play Console** — Required for Play Store submission:
   - Enroll at play.google.com/console
   - Configure signing keys and app listing

> **TIP:** For dev iteration, uncomment the `server.url` line in `capacitor.config.ts` and point it to your dev machine's IP. This enables live reload on the device without rebuilding.
