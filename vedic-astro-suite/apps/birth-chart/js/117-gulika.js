/* ============================================================================
   GULIKA (also called Mandi by many teachers): the son of Saturn, an upagraha (sub-planet), a point in the zodiac, not a body.
   Method (as taught in BPHS chapter 3 on the upagrahas and in teaching sources): the daytime (sunrise to sunset) or the night (sunset to next sunrise)
   is cut into 8 equal parts. For a day birth the first part belongs to the weekday lord; for a night birth the first part belongs to the 5th planet
   counted from the weekday lord. Gulika is the rising sign and degree (the lagna) at the moment of Saturn's part.
     Saturn's part, day : Sun 7, Mon 6, Tue 5, Wed 4, Thu 3, Fri 2, Sat 1
     Saturn's part, night: Sun 3, Mon 2, Tue 1, Wed 7, Thu 6, Fri 5, Sat 4
   Born before sunrise, the night before is used (previous weekday). SCHOOLS DIFFER on which moment of Saturn's part is used: the start, the middle
   or the end. The default here is the start; GUL.where() / chart.upagraha.Gulika.where tells which one was used and GUL.at(...,where) can show another.
   Nothing here is a prediction. Uses pnRiseSet/pnParts/pnWeekday/pnAddDay (js/45) and ascendantLongitude/lahiriAyanamsa. 3D Sky has its own copy (apps/sky3d/js/52-gulika.js): change both.
   API: computeGulika(jd, lat, lon, tz, where) -> {longitude, sign, degInSign, nakshatra, jd, isDay, weekday, part, where} | null ; GUL.text(chart)
   ============================================================================ */
const GUL_DAY = [7,6,5,4,3,2,1], GUL_NIGHT = [3,2,1,7,6,5,4], GUL_WHERE = ['start','middle','end'];
function computeGulika(jd, lat, lon, tz, where){
  where = GUL_WHERE.includes(where) ? where : 'start';
  const lp = pnParts(jd, tz), rs = pnRiseSet(lp.y, lp.m, lp.d, lat, lon, tz);
  let from, to, isDay, wy = lp.y, wm = lp.m, wd = lp.d;
  if (rs.rise === null || rs.set === null) return null;
  if (jd >= rs.rise && jd < rs.set){ from = rs.rise; to = rs.set; isDay = true; }
  else if (jd >= rs.set){ const [ny, nm, nd] = pnAddDay(lp.y, lp.m, lp.d, 1), nx = pnRiseSet(ny, nm, nd, lat, lon, tz); if (nx.rise === null) return null; from = rs.set; to = nx.rise; isDay = false; }
  else { [wy, wm, wd] = pnAddDay(lp.y, lp.m, lp.d, -1); const pv = pnRiseSet(wy, wm, wd, lat, lon, tz); if (pv.set === null) return null; from = pv.set; to = rs.rise; isDay = false; }
  const w = pnWeekday(wy, wm, wd), n = (isDay ? GUL_DAY : GUL_NIGHT)[w], part = (to - from) / 8;
  const t = from + (n - 1) * part + (where === 'start' ? 0 : where === 'middle' ? part / 2 : part);
  const l = normDeg(ascendantLongitude(t, lat, lon) - lahiriAyanamsa(t));
  return { longitude: l, sign: getSignIndex(l), degInSign: getDegInSign(l), nakshatra: getNakshatra(l), jd: t, isDay, weekday: w, part: n, where };
}
const GUL = {
  text: function(chart){
    const g = chart && chart.upagraha && chart.upagraha.Gulika; if (!g) return '';
    return `Gulika (Mandi): ${SIGNS[g.sign].name} ${g.degInSign.toFixed(2)}°, house ${g.house}, ${g.nakshatra.name} pada ${g.nakshatra.pada}. Found from Saturn's part (part ${g.part} of 8) of the ${g.isDay ? 'day' : 'night'}, taken at the ${g.where} of that part (schools differ).`;
  },
  where: GUL_WHERE
};
