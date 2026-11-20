/* PDF INTELLIGENCE (PDFI): page-cut rules for the PDF book, so pages end after a paragraph and not through a line that matters.
   PDFI.css(th)      -> CSS added to the book (keep headings with the text after them, no lone first/last lines, whole short paragraphs, whole rows and figures, repeating table headers)
   PDFI.prepare(doc) -> marks the laid-out book (measures paragraphs: short ones and labelled lines are kept whole; a heading is tied to what follows it)
   Runs only when the book is printed (nothing at page load). The book has no script, so this file only styles and marks it. */
(function(){
  'use strict';
  const SHORT = 7;   // paragraphs up to this many lines are never split across pages

  function css(){
    return `
  h1,h2,h3,h4,h5{break-after:avoid;break-inside:avoid;orphans:3;widows:3}
  p,dd,li{orphans:3;widows:3}
  p.pi-keep,li,dt,dd,blockquote,figure,figcaption,.cap,.sm.pi-keep,.pi-kwn{break-inside:avoid}
  .pi-kwn{break-before:avoid}
  figcaption,.cap{break-before:avoid}
  figure,svg.chart-svg,.bar-svg{break-inside:avoid}
  table{break-inside:auto}
  thead{display:table-header-group}
  tfoot{display:table-footer-group}
  tr,th,td{break-inside:avoid}
  tr:last-child{break-after:avoid}
  .card,.sig,.plate:not(.deep),.vplate,.facts{break-inside:avoid}
  .pi-tail{break-before:avoid}
  `;
  }

  function lineH(el, cs){ const l = parseFloat(cs.lineHeight); return isFinite(l) && l > 0 ? l : (parseFloat(cs.fontSize) || 14) * 1.5; }

  function prepare(d){
    if (!d || !d.body) return { kept: 0, tied: 0 };
    const w = d.defaultView; let kept = 0, tied = 0;
    d.querySelectorAll('p,dd').forEach(p => {
      if (p.closest('.cover,.end,.divider')) return;
      const cs = w.getComputedStyle(p), h = p.getBoundingClientRect().height; if (!h) return;
      const lines = Math.round(h / lineH(p, cs));
      const labelled = p.firstElementChild && /^(B|STRONG)$/.test(p.firstElementChild.tagName) && !p.firstChild.textContent.trim();
      if (lines <= SHORT || (labelled && lines <= SHORT + 3)){ p.classList.add('pi-keep'); kept++; }
    });
    d.querySelectorAll('h1,h2,h3,h4,h5,.grp').forEach(hd => {
      if (hd.closest('.cover,.end')) return;
      const nx = hd.nextElementSibling; if (nx){ nx.classList.add('pi-kwn'); tied++; }
    });
    return { kept, tied };
  }

  window.PDFI = { css, prepare, SHORT };
})();
