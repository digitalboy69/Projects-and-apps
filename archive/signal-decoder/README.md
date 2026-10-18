# Signal Decoder

A private, offline-capable phone app that turns body feelings into plain words. No accounts, no server: check-ins stay in the browser on your device.

## Put it on your phone
1. Deploy this folder as its own site (Vercel: New Project, pick this repo, set Root Directory to `signal-decoder`, no build command).
2. Open the site on your phone.
3. Android (Chrome): menu, then "Install app" or "Add to Home screen". iPhone (Safari): Share, then "Add to Home Screen".

Test locally: `cd signal-decoder && python3 -m http.server 8001`, then open http://localhost:8001.

## Files
- `index.html` the whole app (styles and code inline)
- `manifest.webmanifest` name, colours and icons for installing
- `sw.js` offline cache
- `icons/` app icons
