import test from "node:test";
import assert from "node:assert/strict";

import {
  computeModel,
  decoherenceMetrics,
  effectiveCoupling,
  marcusBenchmark,
  propagateBloch,
  reservoirRates,
  twoStateMetrics,
} from "../src/model.js";
import { scenarios } from "../src/scenarios.js";

const close = (actual, expected, relativeTolerance = 1e-9) => {
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= relativeTolerance * scale, `${actual} != ${expected}`);
};

test("zero contact coupling remains zero", () => {
  const result = effectiveCoupling({ h0MeV: 0, rNm: 2, r0Nm: 0.5, betaRatePerAngstrom: 1 });
  assert.equal(result.couplingEv, 0);
});

test("rate-decay convention gives exp(-beta delta-r) for squared coupling", () => {
  const result = effectiveCoupling({ h0MeV: 50, rNm: 0.8, r0Nm: 0.5, betaRatePerAngstrom: 0.3 });
  close(result.retainedFraction ** 2, Math.exp(-0.3 * 3), 1e-12);
});

test("zero detuning gives unit Hamiltonian mixing", () => {
  const result = twoStateMetrics({ couplingEv: 0.01, deltaEv: 0, temperatureK: 298 });
  close(result.mixing, 1);
});

test("transverse decay follows Gamma2 = gamma_phi + Gamma1/2", () => {
  const result = decoherenceMetrics({ gamma1PerPs: 2, gammaPhiPerPs: 4, couplingEv: 0.01 });
  close(result.gamma2PerPs, 5);
  close(result.t2Ps, 0.2);
});

test("Marcus benchmark is maximal at Delta G = -lambda", () => {
  const shared = { couplingEv: 0.01, lambdaEv: 0.2, temperatureK: 298, overpotentialV: 0 };
  const activationless = marcusBenchmark({ ...shared, deltaG0Ev: -0.2 });
  const displaced = marcusBenchmark({ ...shared, deltaG0Ev: -0.1 });
  close(activationless.activationNumber, 0);
  assert.ok(activationless.ratePerSecond > displaced.ratePerSecond);
});

test("conductance-capacitance conversion uses SI units", () => {
  const result = reservoirRates({ conductanceNs: 4, quantumCapacitanceAf: 10 });
  close(result.gcqPerSecond, 4e8, 1e-12);
});

test("documented QBET nanogap values are reproduced", () => {
  const result = computeModel(scenarios.qbetNanogap.parameters);
  close(result.coupling.couplingMeV, 31.8814075811, 1e-9);
  close(result.marcus.ratePerSecond, 3.820717321e13, 2e-3);
  close(result.twoState.periodPs, 0.061857, 2e-3);
  close(result.decoherence.t2Ps, 1 / 5.5, 1e-12);
  close(result.decoherence.zeta, 17.615, 2e-3);
  close(result.twoState.equilibriumAcceptor, 0.629, 3e-3);
  close(result.reservoir.gcqPerSecond, 4e8, 1e-12);
});

test("Bloch propagation is deterministic", () => {
  const args = {
    couplingEv: 0.02,
    deltaEv: -0.01,
    temperatureK: 298,
    gamma1PerPs: 1,
    gammaPhiPerPs: 4,
    durationPs: 2,
    steps: 4000,
  };
  assert.deepEqual(propagateBloch(args).finalBloch, propagateBloch(args).finalBloch);
});

test("long-time propagation approaches the Gibbs acceptor population", () => {
  const result = propagateBloch({
    couplingEv: 0.015,
    deltaEv: -0.02,
    temperatureK: 298,
    gamma1PerPs: 2,
    gammaPhiPerPs: 3,
    durationPs: 8,
    steps: 16000,
  });
  const finalAcceptor = (1 - result.finalBloch[2]) / 2;
  close(finalAcceptor, result.twoState.equilibriumAcceptor, 2e-6);
});

test("time-step refinement leaves the final population stable", () => {
  const base = {
    couplingEv: 0.02,
    deltaEv: 0.03,
    temperatureK: 298,
    gamma1PerPs: 1,
    gammaPhiPerPs: 5,
    durationPs: 3,
  };
  const coarse = propagateBloch({ ...base, steps: 3000 });
  const fine = propagateBloch({ ...base, steps: 6000 });
  close((1 - coarse.finalBloch[2]) / 2, (1 - fine.finalBloch[2]) / 2, 1e-7);
});
