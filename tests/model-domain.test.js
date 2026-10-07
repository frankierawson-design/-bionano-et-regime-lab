import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeModel, effectiveCoupling, decoherenceMetrics, propagateBloch } from '../src/model.js';
import { scenarios } from '../src/scenarios.js';

// Read the actual declared UI bounds, so range changes extend this audit.
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const bounds = [...source.matchAll(/key: "(\w+)"[^\n]*min: (-?[\d.]+), max: (-?[\d.]+)/g)]
  .map(([, key, min, max]) => [key, Number(min), Number(max)]);
const base = scenarios.qbetNanogap.parameters;

test('declared UI domain: scenarios, each boundary, adversarial corners and 128 seeded samples', () => {
  assert.equal(bounds.length, 13);
  const cases = Object.values(scenarios).map(s => s.parameters);
  for (const [key, min, max] of bounds) cases.push({ ...base, [key]: min }, { ...base, [key]: max });
  for (const h0MeV of [0, 100]) for (const deltaEv of [-0.5, 0, 0.5])
    for (const gamma1PerPs of [0, 30]) for (const gammaPhiPerPs of [0, 50])
      cases.push({ ...base, h0MeV, deltaEv, gamma1PerPs, gammaPhiPerPs, rNm: 0.1, r0Nm: 2, betaRatePerAngstrom: 2 });
  let seed = 0x024b10;
  const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let i = 0; i < 128; i++) cases.push(Object.fromEntries(bounds.map(([k, lo, hi]) => [k, lo + random() * (hi - lo)])));
  const methods = { rk4: 0, analytic: 0 };
  for (const p of cases) {
    const r = computeModel(p);
    methods[r.dynamics.method]++;
    for (const value of [r.coupling.couplingEv, r.twoState.splittingEv, r.twoState.mixing,
      r.marcus.ratePerSecond, r.reservoir.gcqPerSecond, ...r.dynamics.finalBloch]) assert.ok(Number.isFinite(value));
    assert.ok(r.dynamics.maxBlochNorm <= 1 + 1e-6);
    for (const point of r.dynamics.points) {
      assert.ok(Number.isFinite(point.acceptorRaw));
      assert.ok(point.acceptorRaw >= -5e-7 && point.acceptorRaw <= 1 + 5e-7);
    }
  }
  console.log(`UI domain audit: ${cases.length} cases; ${JSON.stringify(methods)}; all finite and physical`);
});

test('step cap uses analytical propagation and warns about extrapolation and plot aliasing', () => {
  const r = computeModel({ ...base, h0MeV: 100, rNm: 0.1, r0Nm: 2, betaRatePerAngstrom: 2 });
  assert.equal(r.dynamics.steps, 24000);
  assert.equal(r.dynamics.method, 'analytic');
  assert.ok(r.warnings.some(w => w.includes('aliased')));
  assert.ok(r.warnings.some(w => w.includes('extrapolated')));
});

test('zero diagnostic distinguishes undefined 0/0 from unbounded nonzero/0', () => {
  assert.equal(decoherenceMetrics({ couplingEv: 0, gamma1PerPs: 0, gammaPhiPerPs: 0 }).zeta, null);
  assert.equal(decoherenceMetrics({ couplingEv: 0.1, gamma1PerPs: 0, gammaPhiPerPs: 0 }).zeta, Infinity);
  assert.equal(decoherenceMetrics({ couplingEv: 0, gamma1PerPs: 1, gammaPhiPerPs: 0 }).zeta, 0);
});

test('distance and overflow guards include zero coupling under extreme extrapolation', () => {
  assert.throws(() => effectiveCoupling({ ...base, rNm: -1 }), /negative/);
  assert.throws(() => effectiveCoupling({ ...base, r0Nm: 1000, betaRatePerAngstrom: 2 }), /overflow/);
  assert.equal(effectiveCoupling({ ...base, h0MeV: 0, r0Nm: 1000, betaRatePerAngstrom: 2 }).couplingEv, 0);
});

test('explicit coarse RK4 requests fail clearly', () => {
  assert.throws(() => propagateBloch({ couplingEv: 0.1, deltaEv: 0, temperatureK: 298,
    gamma1PerPs: 0, gammaPhiPerPs: 0, durationPs: 1, steps: 1, solver: 'rk4' }), /too coarse/);
});
