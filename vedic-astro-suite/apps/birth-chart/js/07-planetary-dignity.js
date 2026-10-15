
const PLANET_GLYPHS = {Sun:"☉",Moon:"☽",Mars:"♂",Mercury:"☿",Jupiter:"♃",Venus:"♀",Saturn:"♄",Rahu:"☊",Ketu:"☋"};

const EXALTATION = {
  Sun: { sign: 0, deg: 10 },
  Moon: { sign: 1, deg: 3 },
  Mars: { sign: 9, deg: 28 },
  Mercury: { sign: 5, deg: 15 },
  Jupiter: { sign: 3, deg: 5 },
  Venus: { sign: 11, deg: 27 },
  Saturn: { sign: 6, deg: 20 },
  Rahu: { sign: 1, deg: null },
  Ketu: { sign: 7, deg: null }
};
function getDebilitation(name){
  const ex = EXALTATION[name];
  return { sign: (ex.sign+6)%12, deg: ex.deg };
}
const MOOLATRIKONA = {
  Sun: { sign: 4, from: 0, to: 20 },
  Moon: { sign: 1, from: 3, to: 30 },
  Mars: { sign: 0, from: 0, to: 12 },
  Mercury: { sign: 5, from: 15, to: 20 },
  Jupiter: { sign: 8, from: 0, to: 10 },
  Venus: { sign: 6, from: 0, to: 15 },
  Saturn: { sign: 10, from: 0, to: 20 }
};
const OWN_SIGNS = {
  Sun: [4], Moon: [3], Mars: [0,7], Mercury: [2,5], Jupiter: [8,11], Venus: [1,6], Saturn: [9,10],
  Rahu: [], Ketu: []
};
const NATURAL_RELATIONS = {
  Sun: { friends:["Moon","Mars","Jupiter"], enemies:["Venus","Saturn"], neutrals:["Mercury"] },
  Moon: { friends:["Sun","Mercury"], enemies:[], neutrals:["Mars","Jupiter","Venus","Saturn"] },
  Mars: { friends:["Sun","Moon","Jupiter"], enemies:["Mercury"], neutrals:["Venus","Saturn"] },
  Mercury: { friends:["Sun","Venus"], enemies:["Moon"], neutrals:["Mars","Jupiter","Saturn"] },
  Jupiter: { friends:["Sun","Moon","Mars"], enemies:["Mercury","Venus"], neutrals:["Saturn"] },
  Venus: { friends:["Mercury","Saturn"], enemies:["Sun","Moon"], neutrals:["Mars","Jupiter"] },
  Saturn: { friends:["Mercury","Venus"], enemies:["Sun","Moon","Mars"], neutrals:["Jupiter"] }
};

function getDignity(name, signIdx, degInSign){
  if (name==="Rahu" || name==="Ketu"){
    const ex = EXALTATION[name];
    const deb = getDebilitation(name);
    if (signIdx===ex.sign) return { status:"Exalted", label:"Exalted (convention-dependent)" };
    if (signIdx===deb.sign) return { status:"Debilitated", label:"Debilitated (convention-dependent)" };
    return { status:"Neutral", label:"—" };
  }
  const ex = EXALTATION[name];
  const deb = getDebilitation(name);
  if (signIdx===ex.sign){
    if (Math.abs(degInSign-ex.deg)<0.5) return { status:"Exalted", label:"Deep Exaltation (Paramoccha)" };
    return { status:"Exalted", label:"Exalted" };
  }
  if (signIdx===deb.sign){
    if (Math.abs(degInSign-deb.deg)<0.5) return { status:"Debilitated", label:"Deep Debilitation" };
    return { status:"Debilitated", label:"Debilitated" };
  }
  const mt = MOOLATRIKONA[name];
  if (mt && signIdx===mt.sign && degInSign>=mt.from && degInSign<=mt.to){
    return { status:"Moolatrikona", label:"Moolatrikona" };
  }
  if (OWN_SIGNS[name] && OWN_SIGNS[name].includes(signIdx)){
    return { status:"OwnSign", label:"Own Sign (Swakshetra)" };
  }
  const signLord = SIGNS[signIdx].lord;
  if (signLord===name) return { status:"OwnSign", label:"Own Sign (Swakshetra)" };
  const rel = NATURAL_RELATIONS[name];
  if (rel){
    if (rel.friends.includes(signLord)) return { status:"Friend", label:"Friendly Sign" };
    if (rel.enemies.includes(signLord)) return { status:"Enemy", label:"Enemy Sign" };
    return { status:"Neutral", label:"Neutral Sign" };
  }
  return { status:"Neutral", label:"—" };
}
