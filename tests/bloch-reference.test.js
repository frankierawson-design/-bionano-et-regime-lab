import test from 'node:test';
import assert from 'node:assert/strict';
import { propagateBloch, reservoirRates } from '../src/model.js';

// Independent closed-form solution of the documented constant-coefficient ODE.
// No production metric or derivative helper is reused.
function exact(a, t) {
  const E = Math.hypot(2 * a.couplingEv, a.deltaEv);
  const n = E === 0 ? [0, 0, 1] : [2 * a.couplingEv / E, 0, -a.deltaEv / E];
  const s = -Math.tanh(E / (2 * 8.617333262145e-5 * a.temperatureK));
  const p = n[2];
  const v = [0, 0, 1].map((x, i) => x - p * n[i]);
  const cross = [n[1] * v[2] - n[2] * v[1], n[2] * v[0] - n[0] * v[2], n[0] * v[1] - n[1] * v[0]];
  const angle = E * t / 6.582119569e-4;
  const longitudinal = s + (p - s) * Math.exp(-a.gamma1PerPs * t);
  const transverse = Math.exp(-(a.gammaPhiPerPs + a.gamma1PerPs / 2) * t);
  return n.map((x, i) => longitudinal * x + transverse * (v[i] * Math.cos(angle) + cross[i] * Math.sin(angle)));
}

const cases = [
  [0, 0, 0, 0], [0, 0, 2, 3], [0, -0.02, 1, 2],
  [0.01, 0, 0, 0], [0.01, 0.02, 0, 3],
  [0.02, -0.03, 2, 4], [0.001, 0.01, 10, 0],
];
for (const [couplingEv, deltaEv, gamma1PerPs, gammaPhiPerPs] of cases) {
  test(`Bloch analytical trajectory: ${[couplingEv, deltaEv, gamma1PerPs, gammaPhiPerPs]}`, () => {
    const a = { couplingEv, deltaEv, gamma1PerPs, gammaPhiPerPs, temperatureK: 298, durationPs: 1, steps: 4000 };
    const result = propagateBloch(a);
    for (const point of result.points) {
      const expected = (1 - exact(a, point.timePs)[2]) / 2;
      assert.ok(Math.abs(point.acceptorRaw - expected) < 2e-8);
      assert.ok(point.acceptorRaw >= -2e-8 && point.acceptorRaw <= 1 + 2e-8);
    }
    exact(a, 1).forEach((x, i) => assert.ok(Math.abs(result.finalBloch[i] - x) < 4e-8));
    assert.ok(Math.hypot(...result.finalBloch) <= 1 + 4e-8);
  });
}

test('small SI reservoir quantities use relative tolerances', () => {
  const r = reservoirRates({ conductanceNs: 4, quantumCapacitanceAf: 10 });
  for (const [actual, expected] of [[r.conductanceS, 4e-9], [r.capacitanceF, 1e-17]]) {
    assert.ok(Math.abs(actual / expected - 1) < 1e-12);
  }
});

// A resonant undamped two-state system supplies a separate elementary reference.
test('RK4 fourth-order convergence and analytical resonant reference', () => {
  const a = { couplingEv: 0.001, deltaEv: 0, temperatureK: 298, gamma1PerPs: 0,
    gammaPhiPerPs: 0, durationPs: 1 };
  const angle = 2 * a.couplingEv / 6.582119569e-4;
  const reference = [0, -Math.sin(angle), Math.cos(angle)];
  const errors = [64, 128, 256].map(steps => {
    const r = propagateBloch({ ...a, steps, solver: 'rk4' });
    return Math.hypot(...r.finalBloch.map((v, i) => v - reference[i]));
  });
  assert.ok(errors[0] / errors[1] > 15 && errors[0] / errors[1] < 17);
  assert.ok(errors[1] / errors[2] > 15 && errors[1] / errors[2] < 17);
  const analytic = propagateBloch({ ...a, steps: 1, solver: 'analytic' });
  analytic.finalBloch.forEach((v, i) => assert.ok(Math.abs(v - reference[i]) < 1e-14));
});

for (const [couplingEv, deltaEv, gamma1PerPs, gammaPhiPerPs] of cases) {
  test(`explicit analytical trajectory: ${[couplingEv, deltaEv, gamma1PerPs, gammaPhiPerPs]}`, () => {
    const a = { couplingEv, deltaEv, gamma1PerPs, gammaPhiPerPs, temperatureK: 298, durationPs: 1, steps: 100, solver: 'analytic' };
    const r = propagateBloch(a);
    for (const p of r.points) assert.ok(Math.abs(p.acceptorRaw - (1 - exact(a, p.timePs)[2]) / 2) < 1e-12);
  });
}
