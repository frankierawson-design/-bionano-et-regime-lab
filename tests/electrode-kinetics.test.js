import test from 'node:test';
import assert from 'node:assert/strict';
import {surfaceRates,advanceSurfaceOccupancy,simulateSurfaceCV,FARADAY,GAS_CONSTANT} from '../src/electrode-kinetics.js';
const p={k0PerS:2,formalPotentialV:0,alpha:.5,n:1,temperatureK:298.15};

test('constant-potential propagation agrees with independent analytical limit',()=>{
  const result=advanceSurfaceOccupancy(.1,0,.3,p);
  assert.ok(Math.abs(result-(.5+(.1-.5)*Math.exp(-4*.3)))<1e-14);
});
test('Nernst occupancy is stationary and positive potential favours oxidation',()=>{
  const r=surfaceRates(.08,p);
  assert.ok(r.oxidationPerS>r.reductionPerS);
  assert.ok(Math.abs(r.equilibriumReduced/(1-r.equilibriumReduced)-Math.exp(-FARADAY*.08/(GAS_CONSTANT*298.15)))<1e-14);
  assert.ok(Math.abs(advanceSurfaceOccupancy(r.equilibriumReduced,.08,10,p)-r.equilibriumReduced)<1e-14);
});
test('zero kinetics preserves occupancy while charging remains measurable',()=>{
  const s=simulateSurfaceCV({...p,k0PerS:0,timeS:[0,1],potentialV:[0,.1],totalRedoxChargeC:1e-8,capacitanceF:2e-8,initialReduced:.8});
  assert.equal(s.points[1].reducedFraction,.8);assert.ok(s.intervals[0].faradaicCurrentA===0);
  assert.ok(Math.abs(s.intervals[0].totalCurrentA-2e-9)<1e-23);
});
test('integrated anodic charge equals loss of reduced occupancy',()=>{
  const s=simulateSurfaceCV({...p,timeS:[0,.1,.4,1],potentialV:[-.1,0,.1,.2],totalRedoxChargeC:3e-9,initialReduced:1});
  const q=s.intervals.reduce((a,r)=>a+r.faradaicCurrentA*r.dtS,0);
  assert.ok(Math.abs(q-3e-9*(1-s.points.at(-1).reducedFraction))<1e-23);
  s.points.forEach(r=>assert.ok(r.reducedFraction>=0&&r.reducedFraction<=1));
});
test('fast reversible surface peak agrees with n F Q v / 4 RT',()=>{
  const count=20000,v=.1;
  const potentialV=Array.from({length:count+1},(_,j)=>-.2+.4*j/count);
  const timeS=potentialV.map(e=>(e+.2)/v),q=1e-8;
  const s=simulateSurfaceCV({...p,k0PerS:1e5,timeS,potentialV,totalRedoxChargeC:q});
  const maximum=Math.max(...s.intervals.map(r=>r.faradaicCurrentA));
  const expected=FARADAY*q*v/(4*GAS_CONSTANT*298.15);
  assert.ok(Math.abs(maximum/expected-1)<1e-5);
});
test('invalid physical domains and overflowing rates fail explicitly',()=>{
  assert.throws(()=>surfaceRates(0,{...p,alpha:1}),RangeError);
  assert.throws(()=>surfaceRates(0,{...p,k0PerS:-1}),RangeError);
  assert.throws(()=>surfaceRates(0,{...p,n:1.5}),RangeError);
  assert.throws(()=>surfaceRates(100,p),RangeError);
  assert.throws(()=>advanceSurfaceOccupancy(1.1,0,1,p),RangeError);
  assert.throws(()=>simulateSurfaceCV({...p,timeS:[0,0],potentialV:[0,1],totalRedoxChargeC:1}),RangeError);
});
