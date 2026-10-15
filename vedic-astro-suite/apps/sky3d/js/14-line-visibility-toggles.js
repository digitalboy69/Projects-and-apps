/* ============================================================================
   LINE VISIBILITY TOGGLES
   Each toggle controls a group of scene objects so the person can declutter
   the view and focus on whichever relationships matter to them.
   ============================================================================ */
let lineToggleState = {
  zodiacSignLines: true,
  nakshatraTicks: true,
  aspectLines: true,
  houseLines: true
};

// Aspect lines (drawn fresh whenever positions/aspect-toggle changes) live in their own group
const aspectLineGroup = new THREE.Group();
function applyLineToggles(){
  // Zodiac ring: sign-divider lines vs nakshatra ticks are both THREE.Line children;
  // sign dividers are thicker/brighter (color 0x5A7A9B), nakshatra ticks dimmer (0x2A3A55)
  zodiacRingGroup.children.forEach(child=>{
    if (child.type!=="Line") return;
    const isNak = child.material.color.getHex()===0x2A3A55;
    child.visible = isNak ? lineToggleState.nakshatraTicks : lineToggleState.zodiacSignLines;
  });
  zodiacRingGroup.children.forEach(c=>{ const k = c.userData && c.userData.kind; if (k==='sign') c.visible = lineToggleState.zodiacSignLines; else if (k==='nak') c.visible = lineToggleState.nakshatraTicks; });
  aspectLineGroup.visible = lineToggleState.aspectLines;
  markDirty();
}

const LINE_TOGGLE_DEFS = [
  { key:'zodiacSignLines', label:'Sign Boundaries', sub:'12 rashi divider lines', modes:['geo'] },
  { key:'nakshatraTicks', label:'Nakshatra Ticks', sub:'27 nakshatra boundary marks', modes:['geo'] },
  { key:'aspectLines', label:'Aspect Lines', sub:'Graha drishti lines between planets', modes:['geo'] },
];

function renderLineToggleList(){
  const wrap = document.getElementById('lineToggleList');
  wrap.innerHTML = "";
  LINE_TOGGLE_DEFS.forEach(def=>{
    const row = document.createElement('div');
    row.className = 'line-toggle-row';
    row.dataset.modes = def.modes.join(',');
    row.innerHTML = `
      <div>
        <div class="lt-label">${def.label}</div>
        <div class="lt-sub">${def.sub}</div>
      </div>
      <label class="switch">
        <input type="checkbox" data-ltkey="${def.key}" ${lineToggleState[def.key] ? 'checked':''}>
        <span class="slider"></span>
      </label>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('input[data-ltkey]').forEach(inp=>{
    inp.addEventListener('change', ()=>{
      lineToggleState[inp.dataset.ltkey] = inp.checked;
      applyLineToggles();
    });
  });
  updateLineToggleVisibility();
}

function updateLineToggleVisibility(){
  document.querySelectorAll('.line-toggle-row').forEach(row=>{
    const modes = (row.dataset.modes || 'geo').split(',');
    row.style.display = modes.includes(mode) ? '' : 'none';
  });
}

