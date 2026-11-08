# StudyQuest — real installed desktop + mobile testing

The project keeps one cloud backend: Supabase. Windows, Android, iOS and the browser all use the same Auth and database.

## Windows installed app

### Requirements
- Windows 10/11
- Node.js 20+
- Rust stable + Cargo
- Visual Studio Build Tools with **Desktop development with C++**

### 1. Keep your local `.env`

The file must contain your real public Supabase values:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY
```

Do not commit `.env`. The publishable/anon key is a client key; never put a Supabase service-role key in the frontend.

### 2. Install dependencies

```bash
npm install
```

### 3. Test as a desktop app

```bash
npm run desktop:dev
```

This opens a real native StudyQuest window instead of a normal browser tab.

### 4. Build the installer

```bash
npm run desktop:build
```

Look under:

```text
src-tauri/target/release/bundle/
```

You should get an NSIS `.exe` installer and/or an MSI package.

## Android

```bash
npm run mobile:android
```

This opens Android Studio. Build/install the APK from Android Studio onto a real phone or emulator.

## Account behavior

- The first app screen requires a real Supabase account.
- A signed-in account is not treated as a guest.
- Local storage is namespaced by Supabase user ID to avoid mixing two accounts on one device.
- Supabase `persistSession` keeps the signed-in session across app restarts.
- The same email/password account can be used on another device and its cloud data is loaded there.
- Signing out returns to the login gate.
- Account creation is unique to the Supabase account/email; it does not create a new local profile each time the app opens.
