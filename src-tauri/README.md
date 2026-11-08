# StudyQuest Desktop

Windows desktop packaging is provided by Tauri 2.

## Requirements
- Node.js 20+
- Rust stable + Cargo
- Microsoft Visual Studio Build Tools with Desktop development with C++
- WebView2 runtime (the installer embeds the WebView2 bootstrapper)

## Run

```bash
npm install
npm run desktop:dev
```

## Build installer

```bash
npm run desktop:build
```

The generated Windows installers are placed under `src-tauri/target/release/bundle/`.

The desktop app uses the same Vite frontend and the same configured Supabase backend as the web/mobile builds. No local database is introduced by the desktop shell.
