/* ============================================================================
   QUICK SEARCH — click any placement in the chart to Google it
   ============================================================================ */
let qsearchActive = false;
let qsearchEngine = 'google'; // 'google' | 'google-ai'

(function initQuickSearch(){
  const btn = document.getElementById('quickSearchBtn');
  const popover = document.getElementById('quickSearchPopover');
  const toggle = document.getElementById('qsearchToggle');
  const engineGoogleBtn = document.getElementById('qsearchEngineGoogle');
  const engineAiBtn = document.getElementById('qsearchEngineAi');
  const liveBadge = document.getElementById('qsearchLiveBadge');
  const liveBadgeText = document.getElementById('qsearchLiveBadgeText');
  const liveBadgeOff = document.getElementById('qsearchLiveBadgeOff');

  function engineLabel(){ return qsearchEngine === 'google-ai' ? 'Google AI Search' : 'Google Search'; }

  function refreshUI(){
    btn.classList.toggle('qsearch-active', qsearchActive);
    toggle.classList.toggle('on', qsearchActive);
    engineGoogleBtn.classList.toggle('active', qsearchEngine === 'google');
    engineAiBtn.classList.toggle('active', qsearchEngine === 'google-ai');
    document.body.classList.toggle('qsearch-mode-on', qsearchActive);
    liveBadge.classList.toggle('show', qsearchActive);
    liveBadgeText.textContent = `🔍 Quick Search active (${engineLabel()}) — click anything in the chart`;
  }

  // Restore saved preference
  try {
    const saved = JSON.parse(localStorage.getItem('VedicAstrology_quickSearch') || 'null');
    if (saved){ qsearchActive = !!saved.active; qsearchEngine = saved.engine || 'google'; }
  } catch(e){}
  refreshUI();

  function persist(){
    try { localStorage.setItem('VedicAstrology_quickSearch', JSON.stringify({active: qsearchActive, engine: qsearchEngine})); } catch(e){}
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    popover.classList.toggle('show');
  });
  document.addEventListener('click', (e) => {
    if (popover.classList.contains('show') && !popover.contains(e.target) && e.target !== btn && !btn.contains(e.target)){
      popover.classList.remove('show');
    }
  });

  toggle.addEventListener('click', () => {
    qsearchActive = !qsearchActive;
    refreshUI(); persist();
  });
  engineGoogleBtn.addEventListener('click', () => { qsearchEngine = 'google'; refreshUI(); persist(); });
  engineAiBtn.addEventListener('click', () => { qsearchEngine = 'google-ai'; refreshUI(); persist(); });
  liveBadgeOff.addEventListener('click', () => { qsearchActive = false; refreshUI(); persist(); });

  // Elements inside the chart that should never trigger a search themselves
  // (their own click behaviour — buttons, inputs, links, tabs, dropdowns — stays intact).
  const IGNORE_SELECTOR = 'button, a, input, select, textarea, label, .app-tab, .btn';
  // Preferred "unit of meaning" to grab text from, most specific first.
  const UNIT_SELECTOR = [
    '.detail-chip', '.planet-clickable', '.big3-value', '.badge', '.karaka-card',
    '.house-card', '.yoga-card', '.varga-house', '.shadbala-card', '.dasha-period-row',
    'td', 'th', 'li', '.rd-value'
  ].join(', ');

  function buildQueryText(target){
    const unit = target.closest(UNIT_SELECTOR);
    const el = unit || target;
    let text = (el.innerText || el.textContent || '').replace(/\s+/g,' ').trim();
    if (text.length > 140) text = text.slice(0,140);
    return text;
  }

  function openSearch(query){
    const q = encodeURIComponent(query + ' vedic astrology meaning');
    const url = qsearchEngine === 'google-ai'
      ? `https://www.google.com/search?q=${q}&udm=50`
      : `https://www.google.com/search?q=${q}`;
    window.open(url, '_blank', 'noopener');
  }

  // Capture phase so this runs before any chart element's own click handler.
  document.addEventListener('click', (e) => {
    if (!qsearchActive) return;
    const panel = e.target.closest('.app-panel');
    if (!panel) return; // only intercept clicks on chart content, not header/nav/modals
    if (e.target.closest(IGNORE_SELECTOR)) return; // let real controls keep working
    const text = buildQueryText(e.target);
    if (!text) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openSearch(text);
  }, true);
})();

