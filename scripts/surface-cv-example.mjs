import {writeFileSync,mkdirSync} from 'node:fs';
import {simulateSurfaceCV} from '../src/electrode-kinetics.js';
const directory=process.argv[2]??'results/surface-cv';mkdirSync(directory,{recursive:true});
const curves=[];
for(const k0PerS of [.2,2,20]) {
  const potentialV=Array.from({length:2001},(_,j)=>j<=1000?-.3+.6*j/1000:.3-.6*(j-1000)/1000);
  const timeS=potentialV.map((_,j)=>j*.006);
  curves.push({k0PerS,...simulateSurfaceCV({timeS,potentialV,k0PerS,formalPotentialV:0,alpha:.5,n:1,
    temperatureK:298.15,totalRedoxChargeC:1e-8,capacitanceF:2e-9})});
}
writeFileSync(`${directory}/synthetic_curves.json`,JSON.stringify({status:'illustrative simulations; no experimental parameters fitted',curves},null,2));
console.log(`Wrote ${curves.length} illustrative curves to ${directory}`);
