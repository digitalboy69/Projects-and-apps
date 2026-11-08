/* Gochara Vedha (js/142): a transit planet in a favourable house from the birth Moon is said to be OBSTRUCTED when another planet sits in that house's paired vedha house.
   Pairs (favourable house -> vedha house, houses counted from the birth Moon sign), from four published tables:
     ashtakvargajyoti.wordpress.com (all pairs), vedastro.org Hindu Predictive Astrology ch.34 (all pairs), astrogurukul.com and webastrologers.com (the same house sets, in lists),
     jagannathhora.com/gochara (Saturn and Jupiter pairs).
   They agree except: Mercury's 10th. Three sources pair it with 8 (ashtakvargajyoti, astrogurukul, webastrologers); vedastro prints 7. This app uses 8 and says so on the page.
   Also: astrogurukul lists 7 vedha points for Venus's 8 favourable houses (it drops 12 and its pair, 12->3, which the two pair tables give); the app uses the nine full pairs.
   Exceptions in every source: the Sun and Saturn do not obstruct each other; the Moon and Mercury do not obstruct each other.
   Rahu and Ketu are left out (jagannathhora: the nodes are generally outside the vedha scheme), neither as the transiting planet nor as the blocker.
   NOT verified: a classical verse (Phaladeepika / Brihat Samhita); the "reverse vedha" idea that webastrologers mentions, which is not built.
   Tendency wording only: "obstructed" means the good result tends to be held back, not that anything bad is promised. Classes gv- prefixed. Reused by TDY (js/122). */
const GVD = (() => {
  const PAIRS = {
    Sun:     { 3: 9, 6: 12, 10: 4, 11: 5 },
    Moon:    { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 },
    Mars:    { 3: 12, 6: 9, 11: 5 },
    Mercury: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
    Jupiter: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
    Venus:   { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3 },
    Saturn:  { 3: 12, 6: 9, 11: 5 }
  };
  const EXEMPT = [['Sun', 'Saturn'], ['Moon', 'Mercury']];
  const exempt = (a, b) => EXEMPT.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));

  /* houses: { Sun: 3, Moon: 5, ... } house from the birth Moon (1-12). Returns, for each of the seven planets that has a pair table:
     { house, favourable, vedhaHouse, blockedBy:[planet,...] } */
  function check(houses) {
    const out = {};
    Object.keys(PAIRS).forEach(n => {
      const h = houses[n];
      if (h == null) return;
      const v = PAIRS[n][h];
      const fav = v != null;
      const by = fav ? Object.keys(PAIRS).filter(o => o !== n && houses[o] === v && !exempt(n, o)) : [];
      out[n] = { house: h, favourable: fav, vedhaHouse: fav ? v : null, blockedBy: by };
    });
    return out;
  }
  function note(n, r) {
    return r.blockedBy.length ? `${r.blockedBy.join(' and ')} in the ${ord(r.vedhaHouse)} holds back ${n}'s good ${ord(r.house)}` : '';
  }
  function text(houses) {
    const c = check(houses), b = Object.keys(c).filter(n => c[n].blockedBy.length);
    return b.length ? 'Vedha: ' + b.map(n => note(n, c[n])).join('; ') : 'Vedha: none of the favourable transits is held back.';
  }
  return { PAIRS, EXEMPT, check, note, text, exempt, ord };
})();
