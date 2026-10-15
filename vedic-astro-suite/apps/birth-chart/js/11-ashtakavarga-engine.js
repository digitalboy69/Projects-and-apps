
const CONTRIBUTION_TABLE = {
  Sun: { Sun:[1,2,4,7,8,9,10,11], Moon:[3,6,10,11], Mars:[1,2,4,7,8,9,10,11], Mercury:[3,5,6,9,10,11,12], Jupiter:[5,6,9,11], Venus:[6,7,12], Saturn:[1,2,4,7,8,9,10,11], Lagna:[3,4,6,10,11,12] },
  Moon: { Sun:[3,6,7,8,10,11], Moon:[1,3,6,7,10,11], Mars:[2,3,5,6,9,10,11], Mercury:[1,3,4,5,7,8,10,11], Jupiter:[1,4,7,8,10,11,12], Venus:[3,4,5,7,9,10,11], Saturn:[3,5,6,11], Lagna:[3,6,10,11] },
  Mars: { Sun:[3,5,6,10,11], Moon:[3,6,11], Mars:[1,2,4,7,8,10,11], Mercury:[3,5,6,11], Jupiter:[6,10,11,12], Venus:[6,8,11,12], Saturn:[1,4,7,8,9,10,11], Lagna:[1,3,6,10,11] },
  Mercury: { Sun:[5,6,9,11,12], Moon:[2,4,6,8,10,11], Mars:[1,2,4,7,8,9,10,11], Mercury:[1,3,5,6,9,10,11,12], Jupiter:[6,8,11,12], Venus:[1,2,3,4,5,8,9,11], Saturn:[1,2,4,7,8,9,10,11], Lagna:[1,2,4,6,8,10,11] },
  Jupiter: { Sun:[1,2,3,4,7,8,9,10,11], Moon:[2,5,7,9,11], Mars:[1,2,4,7,8,10,11], Mercury:[1,2,4,5,6,9,10,11], Jupiter:[1,2,3,4,7,8,10,11], Venus:[2,5,6,9,10,11], Saturn:[3,5,6,12], Lagna:[1,2,4,5,6,7,9,10,11] },
  Venus: { Sun:[8,11,12], Moon:[1,2,3,4,5,8,9,11,12], Mars:[3,5,6,9,11,12], Mercury:[3,5,6,9,11], Jupiter:[5,8,9,10,11], Venus:[1,2,3,4,5,8,9,10,11], Saturn:[3,4,5,8,9,10,11], Lagna:[1,2,3,4,5,8,9,11] },
  Saturn: { Sun:[1,2,4,7,8,10,11], Moon:[3,6,11], Mars:[3,5,6,10,11,12], Mercury:[6,8,9,10,11,12], Jupiter:[5,6,11,12], Venus:[6,11,12], Saturn:[3,5,6,11], Lagna:[1,3,4,6,10,11] }
};
const BAV_PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
const CONTRIBUTORS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Lagna"];
function signsFromOffsets(contributorSignIdx, offsets){ return offsets.map(offset => (contributorSignIdx + offset - 1) % 12); }
function computeBAV(forPlanet, signPositions){
  const bav = new Array(12).fill(0);
  const rules = CONTRIBUTION_TABLE[forPlanet];
  CONTRIBUTORS.forEach(contributor=>{
    const contributorSign = signPositions[contributor];
    const offsets = rules[contributor];
    const receivingSigns = signsFromOffsets(contributorSign, offsets);
    receivingSigns.forEach(signIdx=> bav[signIdx]++);
  });
  return bav;
}
function computeFullAshtakavarga(signPositions){
  const bavTables = {};
  BAV_PLANETS.forEach(p=> bavTables[p] = computeBAV(p, signPositions));
  const sav = new Array(12).fill(0);
  BAV_PLANETS.forEach(p=> bavTables[p].forEach((v,i)=> sav[i]+=v));
  return { bavTables, sav };
}
