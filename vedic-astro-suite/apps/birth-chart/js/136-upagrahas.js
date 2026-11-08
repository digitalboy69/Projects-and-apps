/* Upagrahas (js/136): the five Sun-based shadow points (aprakasha grahas) plus Gulika, shown as a table: sign, degree, nakshatra, house.
   Formulas (agree in en.wikipedia.org/wiki/Upagraha and dekhopanchang.com/upagraha; the chain is from BPHS), all in SIDEREAL longitude:
     Dhuma = Sun + 133 deg 20 min ; Vyatipata = 360 - Dhuma ; Parivesha = Vyatipata + 180 ; Indrachapa = 360 - Parivesha ; Upaketu = Indrachapa + 16 deg 40 min
   Consequences: Dhuma and Indrachapa are always 180 apart, Vyatipata and Parivesha are always 180 apart, Upaketu = Sun + 330 (= Sun - 30).
   Effects are NOT stated: the two pages disagree (Parivesha and Upaketu are benefic or mixed depending on the page), so this page only places the points.
   "Vyatipata" here is the upagraha, not the panchang yoga of the same name (js/45). Gulika comes from chart.upagraha.Gulika (js/117), not from the Sun; Mandi is not shown separately.
   Does not change chart.upagraha. Classes upa- prefixed. Tendencies only. */
const UPA = (() => {
  const ORDER = ['Dhuma', 'Vyatipata', 'Parivesha', 'Indrachapa', 'Upaketu'];
  const ALIAS = { Dhuma: 'Dhūma', Vyatipata: 'Vyatīpāta, Pāta', Parivesha: 'Pariveṣa, Paridhi', Indrachapa: 'Indracāpa, Kodanda', Upaketu: 'Upaketu, Shikhi' };
  const WHAT = {
    Dhuma: 'Sun + 133°20′', Vyatipata: '360° − Dhuma', Parivesha: 'Vyatipata + 180°', Indrachapa: '360° − Parivesha', Upaketu: 'Indrachapa + 16°40′'
  };
  const n = x => (x >= 0 && x < 360) ? x : ((x % 360) + 360) % 360;
  const point = (name, lon, ascSign, how) => {
    const l = n(lon), sg = getSignIndex(l);
    return { name, alias: ALIAS[name] || '', longitude: l, sign: sg, signName: SIGNS[sg].name, degInSign: getDegInSign(l), nakshatra: getNakshatra(l), house: ((sg - ascSign + 12) % 12) + 1, how };
  };
  /* from a Sun longitude only (pure, used by the tests) */
  function fromSun(sun) {
    const dhuma = n(sun + 133 + 20 / 60), vy = n(360 - dhuma), pa = n(vy + 180), ic = n(360 - pa), uk = n(ic + 16 + 40 / 60);
    return { Dhuma: dhuma, Vyatipata: vy, Parivesha: pa, Indrachapa: ic, Upaketu: uk };
  }
  function compute(chart) {
    const L = fromSun(chart.planets.Sun.longitude), a = chart.ascendant.sign, rows = ORDER.map(k => point(k, L[k], a, WHAT[k]));
    const g = chart.upagraha && chart.upagraha.Gulika;
    if (g) rows.push(Object.assign(point('Gulika', g.longitude, a, 'Saturn\'s part of the day or night (Mandi to many teachers)'), { alias: 'Mandi' }));
    return rows;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dm = d => { const t = Math.round(d * 60), m = t % 60; return `${Math.floor(t / 60)}°${String(m).padStart(2, '0')}′`; };
  function html(chart, profile) {
    const rows = compute(chart);
    return `<div class="upa"><div class="upa-hero"><h3>Upagrahas</h3><p>Upagrahas are <b>shadow points</b>: not bodies, but places in the zodiac worked out from the Sun (and, for Gulika, from Saturn's part of the day). Here is where each one falls in your chart.</p></div>
      <div class="upa-list">${rows.map(r => `<article class="upa-card"><header><h4>${r.name}</h4><small>${esc(r.alias)}</small><span class="upa-h">House ${r.house}</span></header>
        <div class="upa-pos"><b>${esc(r.signName)}</b> ${dm(r.degInSign)}</div>
        <div class="upa-nk">${esc(r.nakshatra.name)} · pada ${r.nakshatra.pada}</div>
        <div class="upa-how">${esc(r.how)}</div></article>`).join('')}</div>
      <details class="upa-note"><summary>How these are worked out</summary>
        <p>From the Sun's sidereal longitude: Dhuma = Sun + 133°20′, Vyatipata = 360° − Dhuma, Parivesha = Vyatipata + 180°, Indrachapa = 360° − Parivesha, Upaketu = Indrachapa + 16°40′. Two published sources give the same chain. Because of it Dhuma and Indrachapa always sit opposite each other, and so do Vyatipata and Parivesha.</p>
        <p>Teachers describe the effects of these points differently, so none are claimed here. They are shown for those who read them with the chart. Vyatipata here is the shadow point, not the Panchang yoga of the same name. Gulika uses the start of Saturn's part (schools differ).</p></details></div>`;
  }
  function text(chart) { return compute(chart).map(r => `${r.name}: ${r.signName} ${dm(r.degInSign)}, house ${r.house}, ${r.nakshatra.name} pada ${r.nakshatra.pada}`).join('\n'); }
  window.buildUpagrahasPanel = function (chart, profile) { return html(chart, profile || {}); };
  if (typeof registerLatePanel === 'function') registerLatePanel('panel-upagrahas', window.buildUpagrahasPanel);
  return { compute, html, text, fromSun, ORDER };
})();
