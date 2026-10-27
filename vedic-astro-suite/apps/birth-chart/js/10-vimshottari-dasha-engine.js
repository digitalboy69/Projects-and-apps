
const DASHA_YEARS = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 };
const DASHA_SEQUENCE = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
const DASHA_TOTAL_YEARS = 120;

function addYearsToDate(date, years){
  const ms = years * 365.25 * 24 * 60 * 60 * 1000;
  return new Date(date.getTime() + ms);
}

function calculateVimshottariDasha(moonSiderealLon, birthDateUTC){
  const nakSpan = 360/27;
  const nakIndex = Math.floor(normDeg(moonSiderealLon) / nakSpan);
  const degIntoNak = normDeg(moonSiderealLon) % nakSpan;
  const fractionRemaining = (nakSpan - degIntoNak) / nakSpan;
  const startLord = NAKSHATRAS[nakIndex].lord;
  const balanceYears = fractionRemaining * DASHA_YEARS[startLord];

  const mahadashas = [];
  let cursorDate = new Date(birthDateUTC.getTime());
  // The first mahadasha is only PART of the full cycle: the child is born inside it. Remember the full length and the
  // (virtual) moment it began, so antardashas/pratyantars can be laid out on the FULL cycle and then cut at birth.
  const fullFirst = DASHA_YEARS[startLord];
  mahadashas.push({ lord:startLord, years:balanceYears, startDate:new Date(cursorDate.getTime()), endDate:addYearsToDate(cursorDate, balanceYears),
                    fullYears:fullFirst, fullStart:addYearsToDate(cursorDate, -(fullFirst - balanceYears)) });
  cursorDate = addYearsToDate(cursorDate, balanceYears);

  let seqPos = (DASHA_SEQUENCE.indexOf(startLord)+1) % 9;
  let totalSoFar = balanceYears;
  while (totalSoFar < 130){
    const lord = DASHA_SEQUENCE[seqPos];
    const years = DASHA_YEARS[lord];
    const start = new Date(cursorDate.getTime());
    const end = addYearsToDate(cursorDate, years);
    mahadashas.push({ lord, years, startDate:start, endDate:end });
    cursorDate = end;
    totalSoFar += years;
    seqPos = (seqPos+1)%9;
  }
  return { nakIndex, startLord, balanceYears, mahadashas };
}

function calculateAntardashas(parent){
  // Sub-periods of ANY level. If `parent` was cut off at birth (first mahadasha and the periods inside it that
  // straddle birth), the 9 sub-periods are laid out on its FULL length from its virtual start, then clipped to
  // [parent.startDate, parent.endDate]; earlier ones (before birth) are dropped. Full-length parents are unchanged.
  const startLordIdx = DASHA_SEQUENCE.indexOf(parent.lord);
  const fullYears = parent.fullYears != null ? parent.fullYears : parent.years;
  let cursor = new Date((parent.fullStart || parent.startDate).getTime());
  const t0 = parent.startDate.getTime(), t1 = parent.endDate.getTime();
  const out = [];
  for (let i=0;i<9;i++){
    const adLord = DASHA_SEQUENCE[(startLordIdx+i)%9];
    const adYears = (fullYears * DASHA_YEARS[adLord]) / DASHA_TOTAL_YEARS;
    const fs = new Date(cursor.getTime()), fe = addYearsToDate(cursor, adYears);
    cursor = fe;
    if (fe.getTime() <= t0 + 1) continue;          // finished before birth
    if (fs.getTime() >= t1 - 1) break;
    const start = fs.getTime() < t0 ? new Date(t0) : fs;
    const end   = fe.getTime() > t1 + 1 ? new Date(t1) : fe;
    const item = { lord:adLord, years:(end.getTime()-start.getTime())/(365.25*86400000), startDate:start, endDate:end };
    if (start !== fs || end !== fe){ item.fullYears = adYears; item.fullStart = fs; }
    out.push(item);
  }
  return out;
}
const calculateSubPeriods = calculateAntardashas;

function findActiveDasha(mahadashas, atDate){
  const md = mahadashas.find(m=> atDate>=m.startDate && atDate<m.endDate);
  if (!md) return null;
  const ads = calculateSubPeriods(md);
  const ad = ads.find(a=> atDate>=a.startDate && atDate<a.endDate);
  let pd = null, pds = null, sd = null, sds = null, prd = null, prds = null, dd = null, dds = null;
  if (ad){
    pds = calculateSubPeriods(ad);
    pd = pds.find(p=> atDate>=p.startDate && atDate<p.endDate);
    if (pd){
      sds = calculateSubPeriods(pd);
      sd = sds.find(s=> atDate>=s.startDate && atDate<s.endDate);
      if (sd){
        prds = calculateSubPeriods(sd);
        prd = prds.find(p=> atDate>=p.startDate && atDate<p.endDate);
        if (prd){
          dds = calculateSubPeriods(prd);          // 6th level: Deha dasha (about an hour long)
          dd = dds.find(p=> atDate>=p.startDate && atDate<p.endDate);
        }
      }
    }
  }
  return {
    mahadasha: md, antardasha: ad, allAntardashas: ads,
    pratyantardasha: pd, allPratyantardashas: pds,
    sookshmaDasha: sd, allSookshmaDashas: sds,
    pranaDasha: prd, allPranaDashas: prds,
    dehaDasha: dd, allDehaDashas: dds
  };
}
