/**
 * Independent physics-reference checks for BioNano ET Regime Lab.
 *
 * References are derived from elementary two-level Schrödinger dynamics,
 * the canonical Gibbs population, the classical Marcus expression,
 * detailed balance and integrated charge conservation. This file uses
 * no production integration helper or copied internal reference routine.
 *
 * Scope: numerical consistency tests, NOT experimental or mechanistic
 * validation of bio-nano electron transfer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  effectiveCoupling, twoStateMetrics, propagateBloch,
  marcusBenchmark, reservoirRates,
} from '../src/model.js';
import {
  surfaceRates, advanceSurfaceOccupancy, simulateSurfaceCV,
} from '../src/electrode-kinetics.js';

const HBAR_EV_PS = 6.582119569e-4;
const K_B_EV_K = 8.617333262145e-5;
const FARADAY = 96485.33212;
const GAS_CONSTANT = 8.31446261815324;

function near(actual, expected, tol = 1e-9) {
  assert.ok(Number.isFinite(actual));
  const scale = Math.max(1, Math.abs(expected));
  assert.ok(Math.abs(actual - expected) < scale * tol,
    `expected ${expected}, obtained ${actual}`);
}

test('independent two-state detuned population at first oscillation maximum', () => {
  const h = 0.012; const delta = 0.016;
  const energy = Math.sqrt(4 * h * h + delta * delta);
  const t = Math.PI * HBAR_EV_PS / energy;
  const predicted = 4 * h * h / (4 * h * h + delta * delta);
  const r = propagateBloch({
    couplingEv: h, deltaEv: delta, temperatureK: 298.15,
    gamma1PerPs: 0, gammaPhiPerPs: 0,
    durationPs: t, steps: 8, solver: 'analytic',
  });
  near((1 - r.finalBloch[2]) / 2, predicted, 1e-12);
  near(predicted, 9 / 13, 1e-12);
});

test('uncoupled closed system preserves an initially occupied donor', () => {
  const r = propagateBloch({
    couplingEv: 0, deltaEv: 0.05, temperatureK: 298.15,
    gamma1PerPs: 0, gammaPhiPerPs: 0,
    durationPs: 3, steps: 7, solver: 'analytic',
  });
  near((1 - r.finalBloch[2]) / 2, 0, 1e-12);
});

test('Gibbs acceptor population follows independently derived canonical energy gap', () => {
  const h = 0.01;
  for (const delta of [0.02, -0.02]) {
    const e = Math.hypot(2 * h, delta);
    const pa = 0.5 * (1 - delta / e * Math.tanh(e / (2 * K_B_EV_K * 298.15)));
    const x = twoStateMetrics({couplingEv: h, deltaEv: delta, temperatureK: 298.15});
    near(x.equilibriumAcceptor, pa, 1e-12);
    if (delta > 0) assert.ok(pa < 0.5);
    else assert.ok(pa > 0.5);
  }
});

test('squared coupling obeys the stated rate-decay convention', () => {
  const a = effectiveCoupling({h0MeV: 30, rNm: 0.5, r0Nm: 0.5, betaRatePerAngstrom: 0.8});
  const b = effectiveCoupling({h0MeV: 30, rNm: 1.0, r0Nm: 0.5, betaRatePerAngstrom: 0.8});
  near((b.couplingEv / a.couplingEv) ** 2, Math.exp(-0.8 * 5), 1e-12);
});

test('classical Marcus activation law has symmetry about activationless point', () => {
  const common = {couplingEv: 0.005, lambdaEv: 0.2, temperatureK: 298.15, overpotentialV: 0};
  const central = marcusBenchmark({...common, deltaG0Ev: -0.2});
  const below = marcusBenchmark({...common, deltaG0Ev: -0.26});
  const above = marcusBenchmark({...common, deltaG0Ev: -0.14});
  near(below.ratePerSecond / above.ratePerSecond, 1, 1e-12);
  assert.ok(central.ratePerSecond > below.ratePerSecond);
});

test('nonadiabatic Marcus rate scales with coupling squared at equal nuclear parameters', () => {
  const p = {deltaG0Ev: -0.2, lambdaEv: 0.2, temperatureK: 298.15, overpotentialV: 0};
  const k1 = marcusBenchmark({...p, couplingEv: 0.005}).ratePerSecond;
  const k3 = marcusBenchmark({...p, couplingEv: 0.015}).ratePerSecond;
  near(k3 / k1, 9, 1e-12);
});

test('conductance-capacitance conversion returns 1/tau in inverse seconds', () => {
  const r = reservoirRates({conductanceNs: 4, quantumCapacitanceAf: 10});
  near(r.gcqPerSecond, 4e8, 1e-4);
  near(1 / r.gcqPerSecond, 2.5e-9, 1e-12);
  // These are mathematical rates of stipulated G and C, not measured interfaces.
});

test('surface Butler-Volmer rates obey Nernst detailed balance', () => {
  const p = {k0PerS: 10, formalPotentialV: 0, alpha: 0.4, n: 1, temperatureK: 298.15};
  for (const potentialV of [-0.1, 0, 0.1]) {
    const x = FARADAY * potentialV / (GAS_CONSTANT * p.temperatureK);
    const r = surfaceRates(potentialV, p);
    near(r.reductionPerS / r.oxidationPerS, Math.exp(-x), 1e-11);
    near(r.equilibriumReduced, 1 / (1 + Math.exp(x)), 1e-12);
  }
});

test('exact surface relaxation reaches potential-dependent occupancy', () => {
  const p = {k0PerS: 20, formalPotentialV: 0, alpha: 0.5, n: 1, temperatureK: 298.15};
  const r = surfaceRates(0.05, p);
  const out = advanceSurfaceOccupancy(1, 0.05, 2, p);
  near(out, r.equilibriumReduced, 1e-12);
  assert.ok(out >= 0 && out <= 1);
});

test('integrated faradaic and charging currents conserve imposed total charge', () => {
  const q = 2e-9; const c = 3e-8;
  const potentialV = [-0.05, 0.05, -0.02, 0.07];
  const r = simulateSurfaceCV({
    timeS: [0, 1, 2, 3], potentialV,
    totalRedoxChargeC: q, capacitanceF: c,
    initialReduced: 0.2, k0PerS: 4,
    formalPotentialV: 0, alpha: 0.5,
    n: 1, temperatureK: 298.15,
  });
  const integrated = r.intervals.reduce((sum, p) => sum + p.totalCurrentA * p.dtS, 0);
  const expected = -q * (r.points.at(-1).reducedFraction - r.points[0].reducedFraction)
    + c * (potentialV.at(-1) - potentialV[0]);
  near(integrated, expected, 1e-12);
  assert.equal(r.experimentalFit, false);
  assert.equal(r.includesDiffusion, false);
});
