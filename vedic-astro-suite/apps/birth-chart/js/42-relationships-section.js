function buildRelationshipsSection(chart){
  let pickerHtml = `<div class="rel-picker" id="relPicker">`;
  PLANET_LIST.forEach(name=>{
    pickerHtml += `<button type="button" class="rel-picker-chip" data-rel-planet="${name}"><span>${PLANET_GLYPHS[name]}</span>${name}</button>`;
  });
  pickerHtml += `</div>`;

  return `
  <div class="section-heading"><h3>Relationships — Conjunctions &amp; Aspects</h3><div class="rule"></div></div>
  <div class="rel-intro">Select two or more planets, then find when they were last in aspect and when they next will be — searched against real planetary motion, not estimated. Uses this chart's exact planetary positions as of now to search forward and backward in time.</div>
  ${pickerHtml}
  <div class="rel-system-toggle" id="relSystemToggle">
    <button type="button" class="rel-system-btn active" data-rel-system="vedic">Vedic (House Aspects)</button>
    <button type="button" class="rel-system-btn" data-rel-system="western">Western (Degree Aspects)</button>
  </div>
  <div style="margin-bottom:32px;">
    <button type="button" class="btn btn-primary" id="relFindBtn">Find Relationships</button>
  </div>
  <div id="relResults"></div>`;
}
