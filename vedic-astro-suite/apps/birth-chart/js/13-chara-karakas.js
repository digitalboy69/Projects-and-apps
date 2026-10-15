
const KARAKA_NAMES = ["Atmakaraka","Amatyakaraka","Bhratrikaraka","Matrikaraka","Putrakaraka","Gnatikaraka","Darakaraka"];
const KARAKA_SIGNIFICANCE = {
  Atmakaraka: "Soul, core identity, the central life lesson this incarnation is built around.",
  Amatyakaraka: "Career, profession, advisors and authority figures who shape your path.",
  Bhratrikaraka: "Siblings, courage, effort, close companions.",
  Matrikaraka: "Mother, home environment, emotional foundations.",
  Putrakaraka: "Children, creativity, intelligence, disciples or creative output.",
  Gnatikaraka: "Extended relatives, rivals, recurring obstacles that force growth.",
  Darakaraka: "Spouse, business partners, what marriage and partnership teach you."
};
const KARAKA_ELIGIBLE = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

function calculateCharaKarakas(planetDegrees){
  const ranked = KARAKA_ELIGIBLE
    .map(name => ({ name, deg: planetDegrees[name] }))
    .sort((a,b) => b.deg - a.deg);
  const result = {};
  ranked.forEach((p, idx) => {
    result[KARAKA_NAMES[idx]] = { planet: p.name, degree: p.deg };
  });
  return result;
}
