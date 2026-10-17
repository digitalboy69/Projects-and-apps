/* ===== Profile bridge: every saved profile of the Birth Chart app shows up here, and the profile you open there opens here =====
   Both apps share one browser storage. Main keeps its list under MAIN_KEY; the chart it is showing is written to ACTIVE_KEY.
   Main profiles are shown live (never copied), marked with ✦, and are edited only in the main app. */
(function(){
  'use strict';
  const MAIN_KEY = 'Vedic Astrology_profiles_v1', ACTIVE_KEY = 'vax_active_profile_v1';
  const pid = p => [p && p.name, p && p.dob, p && String(p.tob || '').slice(0,5)].join('|');
  const readJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch(e){ return d; } };
  const rawOwn = () => readJSON(NATAL_STORAGE_KEY, []);
  function mainList(){
    const out = [], seen = {};
    const add = p => { if (!isValidProfile(p) || seen[pid(p)]) return; seen[pid(p)] = 1; out.push(Object.assign({}, p, { fromMain:true })); };
    const m = readJSON(MAIN_KEY, []); if (Array.isArray(m)) m.forEach(add);
    add(readJSON(ACTIVE_KEY, null));
    return out;
  }
  window.loadNatalProfiles = function(){
    const main = mainList(), ids = {}; main.forEach(p => ids[pid(p)] = 1);
    const own = rawOwn(); return main.concat(Array.isArray(own) ? own.filter(p => !ids[pid(p)]) : []);
  };
  window.saveNatalProfiles = function(list){
    const mainIds = {}; mainList().forEach(p => mainIds[pid(p)] = 1);
    const keep = list.filter(p => p && !p.fromMain);
    const have = {}; keep.forEach(p => have[pid(p)] = 1);
    const hidden = rawOwn().filter(p => mainIds[pid(p)] && !have[pid(p)]);   // my own copies hidden behind a main profile: keep them
    localStorage.setItem(NATAL_STORAGE_KEY, JSON.stringify(keep.concat(hidden)));
  };
  const baseRefresh = refreshProfileSelect;
  window.refreshProfileSelect = function(){
    baseRefresh.apply(this, arguments);
    const sel = document.getElementById('profileSelect'), l = loadNatalProfiles();
    [...sel.options].forEach(o => { if (o.value !== '' && l[+o.value] && l[+o.value].fromMain) o.textContent = '✦ ' + l[+o.value].name; });
  };
  function followMain(){
    const a = readJSON(ACTIVE_KEY, null); if (!isValidProfile(a)) return;
    refreshProfileSelect();
    const l = loadNatalProfiles(), i = l.findIndex(p => pid(p) === pid(a));
    if (i < 0) return;
    const sel = document.getElementById('profileSelect');
    if (sel.value !== String(i) || !activeNatalProfile || pid(activeNatalProfile) !== pid(a)){ sel.value = String(i); sel.dispatchEvent(new Event('change')); }
  }
  window.addEventListener('storage', e => {
    if (e.key === ACTIVE_KEY) followMain();
    else if (e.key === MAIN_KEY){ const v = document.getElementById('profileSelect').value; refreshProfileSelect(); document.getElementById('profileSelect').value = v; }
  });
  refreshProfileSelect(); followMain();
})();
