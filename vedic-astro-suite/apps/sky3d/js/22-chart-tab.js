/* ============================================================================
   CHART TAB — Rasi wheel (houses labeled with sign), house table, graha drishti
   Uses the active natal profile if one exists; otherwise falls back to "now"
   (current transiting positions) with a Lagna computed for the user's live
   location if available, or Aries rising as a neutral default.
   ============================================================================ */
let aspectFocusPlanet = "ALL";

function getChartContext(liveSnap){
  if (isValidProfile(activeNatalProfile)){
    const p = activeNatalProfile;
    const { jd, lagnaLon } = computeNatalAscendant(p);
    const snap = snapshotPositions(jd);
    return { sidereal: snap.sidereal, retro: snap.retro, lagnaLon, label: `${p.name}'s Natal Chart`, isNatal:true, jd };
  }
  const snap = liveSnap || snapshotPositions(currentJD);
  // Without a saved birth location we can't compute a true live ascendant, so
  // we default Lagna to Aries (0°) and clearly label this as sign-only view.
  return { sidereal: snap.sidereal, retro: snap.retro, lagnaLon: 0, label: "Current Sky (no natal profile — Aries set as reference Lagna)", isNatal:false, jd: snap.jd };
}

let chartTabContextJD = currentJD; // exposed globally so inline onclick handlers on the wheel/house table can reach it
let selectedWheelSign = null; // sign index currently highlighted via the sign dropdown

function renderChartTab(liveSnap){
  const ctx = getChartContext(liveSnap);
  chartTabContextJD = ctx.jd;
  const lagnaSignIdx = getSignIndex(ctx.lagnaLon);
  renderChartWheel(ctx, lagnaSignIdx);
  renderHouseTable(ctx, lagnaSignIdx);
  renderAspectFocusFilter();
  renderAspectList(ctx);
  renderSignAspectList(ctx);
  renderSignSelector(ctx, lagnaSignIdx);
  renderExplorer(ctx);
}

