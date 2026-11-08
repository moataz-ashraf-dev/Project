# StudyQuest — Mobile Release Setup

The existing React/Vite application is configured for Capacitor so the same UI can be shipped as Android and iOS apps. No new app pages are required.

## 1. Install

Requirements:
- Node.js 20+ and npm 10+
- Android Studio + Android SDK + JDK 17 for Android
- macOS + Xcode for iOS

```bash
npm install
npm run build
```

## 2. Android

First time only:
```bash
npx cap add android
```

Then:
```bash
npm run mobile:android
```

The script creates the native project if it does not exist, syncs `dist`, and opens Android Studio.

For a connected device/emulator, press Run in Android Studio.

## 3. iOS

First time only on macOS:
```bash
npx cap add ios
```

Then:
```bash
npm run mobile:ios
```

In Xcode select a Team/signing profile and a simulator or connected iPhone.

## 4. Mobile behavior already prepared

- Portrait-first PWA manifest.
- Safe-area / notch handling.
- Native status-bar configuration.
- Native splash-screen integration.
- Native local notification permission + study completion notification.
- Timer checkpointing using wall-clock timestamps so backgrounding does not make the timer run incorrectly.
- Mobile bottom navigation with Premium mapped to the Crown item.
- Offline-first storage and cloud sync remain unchanged.

## 5. Store release requirements

These cannot be generated without the owner's store/provider accounts:
- Google Play app signing + Play Console listing.
- Apple Developer signing + App Store Connect listing.
- Real Google Play Billing / Apple In-App Purchase products for Premium.
- Production Supabase project, URL and anon key.
- Production AI Edge Function secrets.
- Privacy policy, terms, support contact and account/data deletion flow.
- Final store screenshots, age rating, app privacy declarations and release notes.

Never put Supabase service-role keys or AI provider secrets in the mobile client.


## Cross-device target
StudyQuest is intended to remain usable as the same app on desktop browsers, tablets, phones, foldables, portrait and landscape orientations. The responsive UI remains unchanged; the added shell settings cover safe areas, mobile browser viewport resizing, PWA installation metadata, and native Android/iOS packaging.

Recommended QA matrix before store submission:
- Windows: Chrome, Edge, Firefox
- macOS: Safari, Chrome
- Android: Chrome on small/large phones and tablets
- iOS/iPadOS: Safari on small/large iPhones and iPads
- Portrait + landscape where the device supports it
- Arabic RTL + English LTR
- Keyboard open/closed, notch/safe-area devices, offline/online transitions


## 6. Windows desktop app

StudyQuest now includes a Tauri 2 desktop shell. It packages the same React app as a real Windows application while keeping Supabase as the cloud source of truth.

Requirements: Node.js 20+, Rust stable, Cargo, and Visual Studio Build Tools with Desktop development with C++.

```bash
npm install
npm run desktop:dev
```

For an installable Windows build:

```bash
npm run desktop:build
```

Installers are generated in `src-tauri/target/release/bundle/` (NSIS `.exe` and MSI).
