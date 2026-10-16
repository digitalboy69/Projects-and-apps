/* ============================================================================
   VIMSHOTTARI DASHA (3D Sky copy) - Mahadasha > Antardasha > Pratyantar, all in Julian Days.
   Same maths as apps/birth-chart/js/10-vimshottari-dasha-engine.js (that one works in Date objects).
   Exposes one global: VDasha.build(moonSiderealLon, birthJD) -> timeline, VDasha.at(timeline, jd) -> running periods.
   ============================================================================ */
const VDasha = (function(){
  'use strict';
  const YEARS = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 };
  const SEQ = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
  const TOTAL = 120, YR = 365.25;
  const NAK = 360/27;

  // Sub-periods of ANY level. A parent cut off at birth keeps its FULL length (fullS/fullY) so the 9 children are laid
  // out on the full cycle and then clipped to [s,e]; children that ended before birth are dropped.
  function sub(p){
    const i0 = SEQ.indexOf(p.lord), out = [];
    let cur = p.fullS;
    for (let i=0;i<9;i++){
      const lord = SEQ[(i0+i)%9], y = p.fullY * YEARS[lord] / TOTAL;
      const fs = cur, fe = cur + y*YR; cur = fe;
      if (fe <= p.s + 1e-6) continue;
      if (fs >= p.e - 1e-6) break;
      out.push({ lord, s:Math.max(fs,p.s), e:Math.min(fe,p.e), fullS:fs, fullY:y });
    }
    return out;
  }

  // Full life timeline: mahadashas plus every pratyantar flattened into one sorted list for fast lookup.
  function build(moonLon, birthJD, lifeYears){
    lifeYears = lifeYears || 125;
    const m = ((moonLon%360)+360)%360;
    const idx = Math.floor(m/NAK), frac = (NAK - m%NAK)/NAK;
    const startLord = SEQ[idx%9], bal = frac * YEARS[startLord];
    const mahas = [{ lord:startLord, s:birthJD, e:birthJD+bal*YR, fullS:birthJD-(YEARS[startLord]-bal)*YR, fullY:YEARS[startLord] }];
    let cur = mahas[0].e, pos = (SEQ.indexOf(startLord)+1)%9;
    while (cur < birthJD + lifeYears*YR){
      const lord = SEQ[pos], y = YEARS[lord];
      mahas.push({ lord, s:cur, e:cur+y*YR, fullS:cur, fullY:y });
      cur += y*YR; pos = (pos+1)%9;
    }
    const segs = [];
    mahas.forEach(md=> sub(md).forEach(ad=> sub(ad).forEach(pd=>{
      segs.push({ s:pd.s, e:pd.e, md:md.lord, ad:ad.lord, pd:pd.lord, mdS:md.s, mdE:md.e, adS:ad.s, adE:ad.e });
    })));
    return { birthJD, startLord, balanceYears:bal, nakIndex:idx, mahas, segs };
  }

  // Running Maha/Antar/Pratyantar at jd (binary search), or null outside the timeline.
  function at(tl, jd){
    const a = tl.segs; let lo = 0, hi = a.length-1;
    while (lo <= hi){
      const mid = (lo+hi) >> 1;
      if (jd < a[mid].s) hi = mid-1; else if (jd >= a[mid].e) lo = mid+1; else return a[mid];
    }
    return null;
  }

  return { YEARS, SEQ, build, at, sub };
})();
