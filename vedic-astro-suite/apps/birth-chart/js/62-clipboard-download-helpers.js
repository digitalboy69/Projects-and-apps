
// Generic clipboard copy helper with button feedback + legacy fallback.
function copyTextToClipboard(text, btnEl, idleLabel){
  const idle = idleLabel || '<span>📋</span> Copy';
  const finish = (ok) => {
    if (!btnEl) return;
    btnEl.innerHTML = ok ? '<span>✓</span> Copied' : '<span>⚠</span> Copy Failed';
    setTimeout(() => { btnEl.innerHTML = idle; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => finish(true)).catch(() => {
      legacyCopyFallback(text, finish);
    });
  } else {
    legacyCopyFallback(text, finish);
  }
}
function legacyCopyFallback(text, finish){
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    finish(ok);
  } catch (e) { finish(false); }
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function formatDateHuman(dob){
  const {y,m,d} = parseDob(dob);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${d} ${months[m-1]} ${y > 0 ? y : (1 - y) + ' BC'}`;
}

function downloadActiveChartImage(format, vargaKey, styleName, personName) {
  downloadActiveChartImageFromWrapper('vargaSvgWrapper', format, vargaKey, styleName, personName);
}

function downloadActiveChartImageFromWrapper(wrapperId, format, vargaKey, styleName, personName) {
  const svgEl = document.querySelector(`#${wrapperId} svg`);
  if (!svgEl) return;

  const safeName = (personName || 'Chart').replace(/[^a-z0-9]/gi, '_');
  const filename = `${safeName}_${vargaKey}_${styleName}_chart.${format}`;

  // Clone SVG and inline critical CSS styles for clean standalone rendering
  const clonedSvg = svgEl.cloneNode(true);
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .chart-bg-outer { fill: #07090F; }
    .chart-line-main { stroke: #D4AF37; stroke-width: 1.6px; }
    .chart-line-sub { stroke: rgba(212,175,55,0.4); stroke-width: 1px; }
    .chart-line-wheel { stroke: rgba(66, 135, 126, 0.4); stroke-width: 1px; }
    .chart-txt-house { fill: rgba(255,255,255,0.4); font-size: 9px; font-family: sans-serif; }
    .chart-txt-sign { fill: #8C7323; font-size: 10px; font-weight: 600; font-family: sans-serif; }
    .chart-txt-asc { fill: #D95F5F; font-size: 10px; font-weight: 700; font-family: sans-serif; }
    .chart-txt-planet { fill: #F9D976; font-size: 11px; font-weight: 600; font-family: sans-serif; }
    .chart-wheel-spoke { stroke: rgba(212,175,55,0.3); stroke-width: 1px; }
    .aspect-line { stroke: rgba(94, 196, 183, 0.55); stroke-width: 1.1px; stroke-dasharray: 3 3; }
    .aspect-line-mars { stroke: rgba(217, 95, 95, 0.6); }
    .aspect-line-jupiter { stroke: rgba(249, 217, 118, 0.6); }
    .aspect-line-saturn { stroke: rgba(107, 127, 163, 0.6); }
  `;
  clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);

  if (format === 'svg') {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else if (format === 'png') {
    // Render to high-resolution 1200x1200 canvas
    const canvas = document.createElement('canvas');
    const scale = 4; // 4x supersampling for ultra-crisp resolution
    canvas.width = 300 * scale;
    canvas.height = 300 * scale;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Draw background
      ctx.fillStyle = '#07090F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  }
}


