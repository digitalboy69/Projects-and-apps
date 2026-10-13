/* ---- Friendly input page: dropdown date/time, quick time guesses, tidy place step, example ---- */
const IN_MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function inBuildFriendly(){
  const dob = document.getElementById('dobInput'), tob = document.getElementById('tobInput');
  if (!dob || !tob || document.getElementById('inDay')) return;
  dob.required = false; tob.required = false;
  const grid = dob.closest('.form-grid'); grid.style.display = 'none';
  const yr = new Date().getFullYear();
  const opt = (a)=> a.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('');
  const days = opt(Array.from({length:31},(_,i)=>[i+1,i+1])), mons = opt(IN_MON.map((m,i)=>[i+1,m]));
  const yrs = opt(Array.from({length:yr-1899},(_,i)=>[yr-i,yr-i]));
  const hrs = opt(Array.from({length:12},(_,i)=>[i+1,i+1])), mins = opt(Array.from({length:60},(_,i)=>[i,String(i).padStart(2,'0')]));
  const box = document.createElement('div'); box.className = 'in-friendly';
  box.innerHTML = `
    <div class="in-q">🎂 Date you were born</div>
    <div class="in-row3"><select id="inDay" aria-label="Day"><option value="">Day</option>${days}</select><select id="inMon" aria-label="Month"><option value="">Month</option>${mons}</select><select id="inYear" aria-label="Year"><option value="">Year</option>${yrs}</select></div>
    <div class="in-bad" id="inBadDate" hidden>That date does not exist. Please check the day and month.</div>
    <div class="in-q">⏰ Time you were born</div>
    <div class="in-row3 t"><select id="inHr" aria-label="Hour"><option value="">Hour</option>${hrs}</select><select id="inMin" aria-label="Minute"><option value="">Minute</option>${mins}</select><div class="in-ampm" id="inAp"><button type="button" data-ap="AM">AM</button><button type="button" data-ap="PM">PM</button></div></div>
    <div class="in-q2">Don't know the exact time? Tap the closest:</div>
    <div class="in-chips" id="inChips"><button type="button" data-t="08:00">🌅 Morning</button><button type="button" data-t="13:00">☀️ Afternoon</button><button type="button" data-t="18:00">🌇 Evening</button><button type="button" data-t="22:00">🌙 Night</button><button type="button" data-t="12:00">🤷 No idea</button></div>
    <div class="in-guess" id="inGuess" hidden></div>`;
  grid.parentNode.insertBefore(box, grid);
  const tip = document.querySelector('.in-step[data-step="2"] .in-tip span');
  if (tip) tip.innerHTML = 'Birth time is on your <b>birth certificate</b>, or ask your parents. A close guess is fine. You can fix it later in <b>Rectify</b>.';
  const $ = id => document.getElementById(id);
  const fire = el => el.dispatchEvent(new Event('input', {bubbles:true}));
  function pushDate(){
    const d = +$('inDay').value, m = +$('inMon').value, y = +$('inYear').value;
    ['inDay','inMon','inYear'].forEach(i=> $(i).classList.toggle('ok', !!$(i).value));
    if (!(d && m && y)) { if (dob.value){ dob.value = ''; fire(dob); } return; }
    const ok = new Date(Date.UTC(y, m-1, d)).getUTCMonth() === m-1; $('inBadDate').hidden = ok;
    dob.value = ok ? `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}` : ''; fire(dob);
  }
  function pushTime(){
    const h = +$('inHr').value, mi = $('inMin').value, ap = ($('inAp').querySelector('.on')||{}).dataset;
    if (h && mi === ''){ $('inMin').value = '0'; }
    ['inHr','inMin'].forEach(i=> $(i).classList.toggle('ok', !!$(i).value));
    const m2 = $('inMin').value;
    if (!(h && m2 !== '' && ap)) { if (tob.value){ tob.value = ''; fire(tob); } return; }
    const h24 = (h % 12) + (ap.ap === 'PM' ? 12 : 0);
    tob.value = `${String(h24).padStart(2,'0')}:${String(+m2).padStart(2,'0')}`; fire(tob);
  }
  // the native 'input' event bubbles to the form and re-syncs the controls from the OLD hidden values (undoing the pick) -> stop it
  ['inDay','inMon','inYear','inHr','inMin'].forEach(i=> $(i).addEventListener('input', e=>e.stopPropagation()));
  ['inDay','inMon','inYear'].forEach(i=> $(i).addEventListener('change', pushDate));
  ['inHr','inMin'].forEach(i=> $(i).addEventListener('change', ()=>{ $('inGuess').hidden = true; $('inChips').querySelectorAll('.on').forEach(b=>b.classList.remove('on')); pushTime(); }));
  $('inAp').addEventListener('click', e=>{ const b = e.target.closest('[data-ap]'); if (!b) return; $('inAp').querySelectorAll('button').forEach(x=>x.classList.toggle('on', x===b)); $('inGuess').hidden = true; pushTime(); });
  $('inChips').addEventListener('click', e=>{
    const b = e.target.closest('[data-t]'); if (!b) return;
    const [H,M] = b.dataset.t.split(':').map(Number); inSetTime(H, M);
    $('inChips').querySelectorAll('button').forEach(x=>x.classList.toggle('on', x===b));
    const g = $('inGuess'); g.hidden = false;
    g.innerHTML = `We will use about <b>${$('inHr').value}:${String($('inMin').value).padStart(2,'0')} ${H>=12?'PM':'AM'}</b>. Your Sun and Moon sign will still be right. Open <b>Rectify</b> later to find your exact time.`;
  });
  window.inSetTime = function(H, M){
    $('inHr').value = (H % 12) || 12; $('inMin').value = M; $('inAp').querySelectorAll('button').forEach(x=>x.classList.toggle('on', x.dataset.ap === (H>=12?'PM':'AM'))); pushTime();
  };
  window.inSyncFriendly = function(){
    const dv = (dob.value||'').split('-').map(Number), tv = (tob.value||'').split(':').map(Number);
    if (dv.length>=3 && dv[0]){ $('inYear').value = dv[0]; $('inMon').value = dv[1]; $('inDay').value = dv[2]; } else if (!dob.value){ ['inDay','inMon','inYear'].forEach(i=> $(i).value=''); }
    if (tv.length>=2 && !isNaN(tv[0]) && tob.value){ const H = tv[0], M = tv[1]; $('inHr').value = (H%12)||12; $('inMin').value = M; $('inAp').querySelectorAll('button').forEach(x=>x.classList.toggle('on', x.dataset.ap === (H>=12?'PM':'AM'))); }
    else if (!tob.value){ $('inHr').value=''; $('inMin').value=''; $('inAp').querySelectorAll('button').forEach(x=>x.classList.remove('on')); }
    ['inDay','inMon','inYear','inHr','inMin'].forEach(i=> $(i).classList.toggle('ok', !!$(i).value));
  };
  // place step: tuck timezone + coordinates away, show a friendly confirmation
  const tz = document.getElementById('tzInput'), co = document.getElementById('coordReadout');
  const f1 = tz.closest('.field'), f2 = co.closest('.field'), pw = document.querySelector('#placeInput').closest('.field');
  const det = document.createElement('details'); det.className = 'in-adv';
  det.innerHTML = '<summary>⚙️ Timezone &amp; coordinates (filled in for you, usually no need to touch)</summary><div class="form-grid"></div>';
  det.querySelector('.form-grid').append(f1, f2); pw.parentNode.appendChild(det);
  const found = document.createElement('div'); found.className = 'in-found'; found.id = 'inFound'; found.hidden = true; pw.appendChild(found);
  const lab = pw.querySelector('label'); if (lab) lab.textContent = 'City or town where you were born';
  const pin = document.getElementById('placeInput'); pin.placeholder = 'Type your city, e.g. Pune, India';
  const nameLab = document.querySelector('label[for="profileName"]'); if (nameLab) nameLab.textContent = 'Your name or nickname';
  // example button
  const sub = document.querySelector('.in-card .submit-row');
  const ex = document.createElement('button'); ex.type = 'button'; ex.className = 'in-ex'; ex.id = 'inEx'; ex.textContent = '👀 Just looking? Try an example first'; sub.appendChild(ex);
  ex.addEventListener('click', ()=>{
    document.getElementById('profileName').value = 'Example Person'; dob.value = '1990-05-15'; fire(dob); inSyncFriendly(); inSetTime(10, 30);
    selectLocation({display_name:'Mumbai, Maharashtra, India', lat:'19.0760', lon:'72.8777', address:{country_code:'in'}});
    fire(document.getElementById('profileName')); inUpdate();
  });
}
function inFoundUpdate(){
  const f = document.getElementById('inFound'); if (!f) return;
  const ok = typeof selectedLat==='number' && !isNaN(selectedLat), tz = document.getElementById('tzInput');
  if (!ok){ f.hidden = true; return; }
  const place = (document.getElementById('placeInput').value||'').split(',').slice(0,2).join(',');
  const t = tz && tz.selectedOptions && tz.selectedOptions[0] ? tz.selectedOptions[0].textContent.split(' ')[0] : '';
  f.hidden = false; f.textContent = '✅ Found: ' + place + (t ? ' · time zone set automatically (' + t + ')' : '');
}
