/* ---- META: keyboard, scroll-lock and accessibility for all modals ---- */
(function(){
  const modals = [...document.querySelectorAll('[id$="Modal"]')];
  const sync = () => document.body.classList.toggle('modal-open', modals.some(m => m.classList.contains('show')));
  modals.forEach(m => {
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    new MutationObserver(sync).observe(m, { attributes: true, attributeFilter: ['class'] });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = modals.filter(m => m.classList.contains('show'));
    if (open.length) open[open.length - 1].classList.remove('show');
  });
  document.querySelectorAll('.pd-modal-close,.export-modal-close,[id$="ModalClose"],#mainMenuClose').forEach(b => b.setAttribute('aria-label', 'Close'));
  const labels = { openMenuBtn: 'Open menu', hdrBack: 'Back to Home' };
  Object.keys(labels).forEach(id => { const el = document.getElementById(id); if (el) el.setAttribute('aria-label', labels[id]); });
  const menuBox = document.querySelector('#mainMenuModal > *');
  if (menuBox) menuBox.insertAdjacentHTML('beforeend', `<div class="menu-version">${APP.name} · v${APP.version}</div>`);
})();

populateTz();
refreshProfileSelect();
