/* ============================================================================
   DATA EXPORT WIRING
   The Export tab and the Export Studio (js/65 engine, js/66 sheet) build the export. generateExportData(type) is kept as the
   old one-call entry point (the shared add-on and any saved scripts call it) and now returns the same structured Markdown.
   ============================================================================ */
function generateExportData(type) {
  const map = { sky: 'quick', all: 'everything' }, only = { transits: ['transits'], conjunctions: ['meetings'], aspects: ['aspects'], sign_aspects: ['aspects', 'relations'] };
  let cfg = XS.defaults();
  if (only[type]) cfg = XS.merge(cfg, { preset: 'custom', sec: only[type] }); else cfg = XS.applyPreset(cfg, map[type] || 'quick');
  return XS.make(cfg).text.trim();
}
