/* PDF DOWNLOAD (PDFD): turns the PDF book (PDFR.build) straight into a .pdf file, with no print window.
   How: the book is laid out in a hidden A4-wide frame; every page is drawn by the browser itself (SVG foreignObject -> canvas -> JPEG)
   and written into a small PDF writer in this file (no library). If the browser cannot do it, PDFR falls back to the print window.
   PDFD.download() -> Promise; PDFD.writePdf(pages, title) builds the file; PDFD.plan(units) plans the page cuts. */
(function(){
  'use strict';
  const W = 794, H = 1123, TOP = 40, BOT = 52, PT_W = 595.28, PT_H = 841.89;
  const enc = new TextEncoder();
  const AVOID = 'tr,.card,.plate,.vplate,.sig,.facts,figure,svg,dt,li';
  const CUT = 'p,h1,h2,h3,h4,h5,dd,dt,li,tr,.card,.plate,.vplate,.sig,.facts,figure,svg,.head,.rule';

  /* ---------- planning: where to cut a tall block into pages, never inside a card, row or paragraph ---------- */
  function plan(units){
    const out = [];
    units.forEach((u, ui) => {
      if (u.height <= H + 8){ out.push({ ui, from: 0, to: u.height, single: true }); return; }
      const cuts = u.cuts.filter(c => c > 0 && c < u.height).sort((a, b) => a - b);
      let from = 0, first = true;
      while (from < u.height - 1){
        const cap = first ? H - BOT : H - TOP - BOT, limit = from + cap;
        if (u.height <= limit + 1){ out.push({ ui, from, to: u.height, first }); break; }
        let to = 0; for (let i = cuts.length - 1; i >= 0; i--){ if (cuts[i] <= limit){ to = cuts[i]; break; } }
        if (to - from < cap * 0.35) to = limit;   // nothing sensible near the page end: cut where the page is full
        out.push({ ui, from, to, first }); from = to; first = false;
      }
    });
    return out;
  }

  /* ---------- PDF writer: one JPEG per A4 page ---------- */
  function hexTitle(t){ let s = 'FEFF'; for (let i = 0; i < t.length; i++) s += t.charCodeAt(i).toString(16).padStart(4, '0'); return '<' + s + '>'; }
  function writePdf(pages, title){
    const parts = []; let pos = 0; const offs = [], N = pages.length;
    const put = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); pos += b.length; };
    const obj = (n, body) => { offs[n] = pos; put(n + ' 0 obj\n'); body(); put('\nendobj\n'); };
    put('%PDF-1.4\n');
    const kids2 = pages.map((_, k) => (5 + 3 * k) + ' 0 R').join(' ');
    obj(1, () => put('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => put('<< /Type /Pages /Count ' + N + ' /Kids [' + kids2 + '] >>'));
    obj(3, () => put('<< /Title ' + hexTitle(title || 'Vedic reading') + ' /Producer (Vedic Astro Suite) >>'));
    pages.forEach((p, k) => {
      const im = 4 + 3 * k, pg = 5 + 3 * k, ct = 6 + 3 * k, content = 'q ' + PT_W + ' 0 0 ' + PT_H + ' 0 0 cm /Im0 Do Q';
      obj(im, () => { put('<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpg.length + ' >>\nstream\n'); put(p.jpg); put('\nendstream'); });
      obj(pg, () => put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PT_W + ' ' + PT_H + '] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + ct + ' 0 R >>'));
      obj(ct, () => put('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'));
    });
    const total = 3 + 3 * N, xr = pos;
    let x = 'xref\n0 ' + (total + 1) + '\n0000000000 65535 f \n';
    for (let n = 1; n <= total; n++) x += String(offs[n]).padStart(10, '0') + ' 00000 n \n';
    put(x + 'trailer\n<< /Size ' + (total + 1) + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xr + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  }

  /* ---------- drawing one page ---------- */
  function pageCss(css){
    return css.replace(/@page[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')                      // print-only page boxes
              .replace(/(^|[},\s])html\s*\{[^}]*\}/g, '$1').replace(/(^|[},\s])body\s*\{/g, '$1.vbody{').replace(/box-shadow:[^;}]*/g, '');
  }
  function svgFor(css, unitXml, s){
    const top = s.single ? 0 : (s.first ? 0 : TOP), h = s.to - s.from;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><foreignObject x="0" y="0" width="' + W + '" height="' + H + '">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + W + 'px;height:' + H + 'px;position:relative;overflow:hidden;background:#fff"><style>' + css + '</style>' +
      '<div style="position:absolute;left:0;top:' + top + 'px;width:' + W + 'px;height:' + (s.single ? H : h) + 'px;overflow:hidden">' +
      '<div class="vbody" style="position:absolute;left:0;top:' + (-s.from) + 'px;width:' + W + 'px;margin:0;background:transparent">' + unitXml + '</div></div></div></foreignObject></svg>';
  }
  function draw(svg, scale, label){
    return new Promise((res, rej) => {
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), img = new Image();
      img.onload = () => {
        try {
          const cw = Math.round(W * scale), ch = Math.round(H * scale), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
          const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cw, ch); c.drawImage(img, 0, 0, cw, ch);
          if (label){ c.fillStyle = '#8a8576'; c.font = (12 * scale) + 'px Georgia,serif'; c.textAlign = 'center'; c.fillText(label, cw / 2, ch - 22 * scale); }
          cv.toBlob(b => { if (!b){ rej(new Error('canvas blocked')); return; } b.arrayBuffer().then(ab => res({ jpg: new Uint8Array(ab), w: cw, h: ch }), rej); }, 'image/jpeg', scale > 1.1 ? 0.5 : 0.45);
        } catch (e) { rej(e); }
      };
      img.onerror = () => { rej(new Error('page image failed')); };
      img.src = url;
    });
  }

  /* ---------- progress card ---------- */
  function ui(){
    let el = document.getElementById('pdfd'); if (el) return el;
    el = document.createElement('div'); el.id = 'pdfd'; el.className = 'pdfd'; el.setAttribute('role', 'status');
    el.innerHTML = '<div class="pdfd-t"><b>Creating your PDF</b><span class="pdfd-n"></span></div><div class="pdfd-bar"><i></i></div><button type="button" class="pdfd-x">Cancel</button>';
    document.body.appendChild(el); return el;
  }
  function show(el, txt, frac){ el.classList.add('on'); el.querySelector('.pdfd-n').textContent = txt; el.querySelector('.pdfd-bar i').style.width = Math.round(frac * 100) + '%'; }

  let busy = false;
  async function download(opts){
    opts = opts || {};
    if (busy) return; busy = true;
    const chart = typeof currentChartForModal !== 'undefined' ? currentChartForModal : null, profile = typeof currentProfileForExport !== 'undefined' ? currentProfileForExport : null;
    if (!chart){ busy = false; throw new Error('no chart'); }
    const el = ui(), cancel = { v: false }; el.querySelector('.pdfd-x').onclick = () => { cancel.v = true; };
    let f = null, url = null;
    try {
      show(el, 'preparing…', 0);
      await new Promise(r => setTimeout(r, 40));
      const html = PDFR.build(chart, profile, opts.build);
      f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;left:-12000px;top:0;width:' + W + 'px;height:' + H + 'px;border:0;visibility:hidden';
      const loaded = new Promise(r => { f.onload = () => { try { if (f.contentDocument && f.contentDocument.querySelector('.cover')) r(); } catch (e) {} }; });
      f.srcdoc = html; document.body.appendChild(f); await loaded;
      const d = f.contentDocument; try { if (d.fonts && d.fonts.ready) await d.fonts.ready; } catch (e) {}
      await new Promise(r => setTimeout(r, 120));
      const css = pageCss([...d.querySelectorAll('style')].map(s => s.textContent).join('\n')), kids = [...d.body.children], ser = new XMLSerializer();
      const units = kids.map(k => {
        const r = k.getBoundingClientRect(), top = r.top + d.defaultView.scrollY, cuts = [];
        k.querySelectorAll(CUT).forEach(e => {
          const b = e.getBoundingClientRect(); if (!b.height) return;
          const inner = e.parentElement && e.parentElement.closest(AVOID);
          if (inner && k.contains(inner) && inner.getBoundingClientRect().height < H * 0.8) return;   // inside a block that should stay whole
          cuts.push(Math.round(b.bottom + d.defaultView.scrollY - top));
        });
        return { height: Math.round(r.height), cuts, xml: null, el: k };
      });
      const pagesPlan = plan(units), scale = (navigator.maxTouchPoints > 0 || window.innerWidth < 800) ? 1.0 : 1.2, pages = [];
      const base = ((profile && profile.name) || 'Vedic').toString();
      for (let i = 0; i < pagesPlan.length; i++){
        if (cancel.v){ throw Object.assign(new Error('cancelled'), { cancelled: true }); }
        const s = pagesPlan[i], u = units[s.ui];
        if (!u.xml) u.xml = ser.serializeToString(u.el);
        if (i && pagesPlan[i - 1].ui !== s.ui) units[pagesPlan[i - 1].ui].xml = null;
        const label = (s.ui === 0 || (s.single && u.el.classList && u.el.classList.contains('divider'))) ? '' : String(i + 1);
        pages.push(await draw(svgFor(css, u.xml, s), scale, label));
        show(el, (i + 1) + ' of ' + pagesPlan.length + ' pages', (i + 1) / pagesPlan.length);
        if (i % 2) await new Promise(r => setTimeout(r, 0));
      }
      show(el, 'saving…', 1);
      const blob = writePdf(pages, 'Vedic Birth Chart Reading - ' + base);
      const name = ('Vedic-Reading-' + base.replace(/[^\wऀ-෿-]+/g, '_') + '-' + new Date().toISOString().slice(0, 10) + '.pdf');
      url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove();
      show(el, 'saved: ' + name, 1); setTimeout(() => el.classList.remove('on'), 5000);
      setTimeout(() => { if (url) URL.revokeObjectURL(url); }, 120000);
      return { name, pages: pages.length, bytes: blob.size, blob };
    } catch (e) {
      el.classList.remove('on'); throw e;
    } finally { if (f) f.remove(); busy = false; }
  }
  window.PDFD = { download, plan, writePdf, ok: typeof Blob === 'function' && typeof XMLSerializer === 'function' };
})();
