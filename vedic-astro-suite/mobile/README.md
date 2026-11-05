# Android app (native + web)

A real Android app (Capacitor) that contains the whole Vedic Astro Suite, so it **works fully offline**, and updates itself when online.

**Install:** open `https://github.com/digitalboy69/projects-and-apps/releases/download/apk-latest/VedicAstroSuite.apk` on the phone, download, and allow "install unknown apps" for your browser when asked.

How it works
- `.github/workflows/android.yml` runs on every push to `main` that touches `vedic-astro-suite/`.
- `scripts/prepare-web.js` copies the web app into `www/`, downloads three.js and the fonts so nothing needs the internet, adds `src/native-bridge.js`, and zips the result as the live-update bundle.
- Gradle builds the signed APK. The installed app checks the `ota-latest` release when online. If a newer web build exists it downloads it in the background and uses it the next time the app is opened. Offline, it just runs the version it has.
- Native changes (new permissions, plugins, icon) need a new APK; ordinary app changes only need a push.

Signing: new APKs must be signed with the same key as the installed one, otherwise Android refuses to install them over it. The workflow keeps a key in the GitHub Actions cache (created on the first build). For a permanent key, add the repo secrets `ANDROID_KEYSTORE_B64` (base64 of your keystore), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, `ANDROID_KEY_ALIAS`.
