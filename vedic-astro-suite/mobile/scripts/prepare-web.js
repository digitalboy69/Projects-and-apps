#!/usr/bin/env node
/* Builds mobile/www (what goes inside the APK) and mobile/ota (the live-update bundle):
   - copies the web app (index.html, apps/, shared/, shell/, vendor/, version.json)
   - makes it work fully offline: downloads three.js and the Google Fonts into vendor/ and points the pages at the local copies
   - adds the native bridge (live updates, back button, status bar)
   - zips www as ota/bundle.zip and writes ota/latest.json */
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const SRC = path.resolve(__dirname, '..', '..'), OUT = path.resolve(__dirname, '..', 'www'), OTA_DIR = path.resolve(__dirname, '..', 'ota');
const OTA_BASE = process.env.OTA_BASE || 'https://github.com/digitalboy69/projects-and-apps/releases/download/build-0';   // where bundle.zip lives (this build's release)
const OTA_LATEST = process.env.OTA_LATEST || 'https://github.com/digitalboy69/projects-and-apps/releases/latest/download';   // stable link to the newest latest.json
const KEEP = ['index.html', 'apps', 'shared', 'shell', 'vendor', 'version.json'];
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const rm = p => fs.rmSync(p, { recursive: true, force: true });
function copy(from, to){ const st = fs.statSync(from); if (st.isDirectory()){ fs.mkdirSync(to, { recursive: true }); fs.readdirSync(from).forEach(n => copy(path.join(from, n), path.join(to, n))); } else fs.copyFileSync(from, to); }
async function get(url, asText, ua){ const r = await fetch(url, { headers: ua ? { 'User-Agent': UA } : {} }); if (!r.ok) throw new Error(url + ' -> ' + r.status); return asText ? r.text() : Buffer.from(await r.arrayBuffer()); }
function walk(d, out = []){ fs.readdirSync(d).forEach(n => { const p = path.join(d, n); fs.statSync(p).isDirectory() ? walk(p, out) : out.push(p); }); return out; }

(async () => {
  rm(OUT); rm(OTA_DIR); fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(OTA_DIR, { recursive: true });
  KEEP.forEach(n => { const p = path.join(SRC, n); if (!fs.existsSync(p)) throw new Error('missing ' + n); copy(p, path.join(OUT, n)); });
  fs.mkdirSync(path.join(OUT, 'vendor', 'fonts'), { recursive: true });

  // three.js (the 3D sky). Required: the build fails if it cannot be fetched, so the APK never ships without it.
  const THREE = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  fs.writeFileSync(path.join(OUT, 'vendor', 'three.min.js'), await get(THREE, false));
  // fonts: optional (system fonts are the fallback)
  const fontCache = new Map(); let fontFiles = 0;
  const htmls = walk(OUT).filter(f => f.endsWith('.html'));
  for (const f of htmls){
    let h = fs.readFileSync(f, 'utf8'); const dir = path.dirname(f), rel = p => path.relative(dir, path.join(OUT, p)).split(path.sep).join('/');
    h = h.split(THREE).join(rel('vendor/three.min.js'));
    const links = h.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/g) || [];
    for (const raw of new Set(links)){
      try {
        const url = raw.replace(/&amp;/g, '&'); let name = fontCache.get(url);
        if (!name){
          let css = await get(url, true, true); const blocks = css.split('@font-face').slice(1).map(b => '@font-face' + b);
          const keep = blocks.filter(b => /\/\* latin(-ext)? \*\//.test(b) || !/\/\* [a-z-]+ \*\//.test(b));
          css = (keep.length ? keep : blocks).join('\n');
          const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)\s'"]+/g) || [])];
          for (const u of urls){ const fn = crypto.createHash('md5').update(u).digest('hex').slice(0, 12) + '.woff2'; fs.writeFileSync(path.join(OUT, 'vendor', 'fonts', fn), await get(u, false)); css = css.split(u).join(fn); fontFiles++; }
          name = 'f' + (fontCache.size + 1) + '.css'; fs.writeFileSync(path.join(OUT, 'vendor', 'fonts', name), css); fontCache.set(url, name);
        }
        h = h.split(raw).join(rel('vendor/fonts/' + name));
      } catch(e){ console.warn('font skipped:', e.message); }
    }
    h = h.replace(/<link[^>]+rel=["']preconnect["'][^>]*fonts\.g[^>]*>/g, '');
    fs.writeFileSync(f, h);
  }
  console.log('fonts downloaded:', fontFiles);

  // native bridge
  fs.writeFileSync(path.join(OUT, 'native-bridge.js'), fs.readFileSync(path.join(__dirname, '..', 'src', 'native-bridge.js'), 'utf8').replace('__OTA_BASE__', OTA_LATEST));
  const idx = path.join(OUT, 'index.html'); let ih = fs.readFileSync(idx, 'utf8');
  if (!ih.includes('native-bridge.js')) ih = ih.replace('</head>', '<script src="native-bridge.js"></script></head>');
  fs.writeFileSync(idx, ih);

  // live-update bundle
  const ver = JSON.parse(fs.readFileSync(path.join(OUT, 'version.json'), 'utf8'));
  const id = String(ver.id || crypto.createHash('md5').update(Date.now() + '').digest('hex').slice(0, 12));
  cp.execSync('zip -qr ' + JSON.stringify(path.join(OTA_DIR, 'bundle.zip')) + ' .', { cwd: OUT });
  const size = fs.statSync(path.join(OTA_DIR, 'bundle.zip')).size;
  fs.writeFileSync(path.join(OTA_DIR, 'latest.json'), JSON.stringify({ id, url: OTA_BASE + '/bundle.zip', size, built: new Date().toISOString() }));
  console.log('www files:', walk(OUT).length, '| bundle', (size / 1048576).toFixed(1) + ' MB | id', id);
})().catch(e => { console.error('prepare-web failed:', e); process.exit(1); });
