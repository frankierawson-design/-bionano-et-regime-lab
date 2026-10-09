export const CONSTANTS = Object.freeze({
  HBAR_EV_S: 6.582119569e-16,
  HBAR_EV_PS: 6.582119569e-4,
  KB_EV_K: 8.617333262145e-5,
  ELEMENTARY_CHARGE_C: 1.602176634e-19,
  PLANCK_J_S: 6.62607015e-34,
});

const finite = (value, name) => {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${name} must be finite`);
  return number;
};

const positive = (value, name) => {
  const number = finite(value, name);
  if (number <= 0) throw new RangeError(`${name} must be greater than zero`);
  return number;
};

const nonNegative = (value, name) => {
  const number = finite(value, name);
  if (number < 0) throw new RangeError(`${name} must not be negative`);
  return number;
};

export function effectiveCoupling({ h0MeV, rNm, r0Nm, betaRatePerAngstrom }) {
  const h0Ev = nonNegative(h0MeV, "h0MeV") / 1000;
  const separationAngstrom = (nonNegative(rNm, "rNm") - nonNegative(r0Nm, "r0Nm")) * 10;
  const beta = nonNegative(betaRatePerAngstrom, "betaRatePerAngstrom");
  const couplingEv = h0Ev === 0 ? 0 : h0Ev * Math.exp(-0.5 * beta * separationAngstrom);
  if (!Number.isFinite(couplingEv)) throw new RangeError("Coupling overflow: reduce extrapolation or rate-decay coefficient");
  return {
    couplingEv,
    couplingMeV: couplingEv * 1000,
    retainedFraction: h0Ev === 0 ? 0 : couplingEv / h0Ev,
    separationAngstrom,
    extrapolated: separationAngstrom < 0,
  };
}

export function twoStateMetrics({ couplingEv, deltaEv, temperatureK }) {
  const h = nonNegative(couplingEv, "couplingEv");
  const delta = finite(deltaEv, "deltaEv");
  const temperature = positive(temperatureK, "temperatureK");
  const splittingEv = Math.hypot(2 * h, delta);
  if (!Number.isFinite(splittingEv / CONSTANTS.HBAR_EV_PS)) throw new RangeError("Hamiltonian frequency exceeds the numeric range");

  if (splittingEv === 0) {
    return {
      splittingEv: 0,
      omegaPs: 0,
      periodPs: Infinity,
      mixing: 0,
      direction: [0, 0, 1],
      equilibriumProjection: 0,
      equilibriumBloch: [0, 0, 0],
      equilibriumAcceptor: 0.5,
    };
  }

  // Basis convention: r_z=+1 is donor occupancy and Delta epsilon=epsilon_A-epsilon_D.
  const direction = [2 * h / splittingEv, 0, -delta / splittingEv];
  const omegaPs = splittingEv / CONSTANTS.HBAR_EV_PS;
  const equilibriumProjection = -Math.tanh(
    splittingEv / (2 * CONSTANTS.KB_EV_K * temperature),
  );
  const equilibriumBloch = direction.map((component) => component * equilibriumProjection);

  return {
    splittingEv,
    omegaPs,
    periodPs: 2 * Math.PI / omegaPs,
    mixing: direction[0] ** 2,
    direction,
    equilibriumProjection,
    equilibriumBloch,
    equilibriumAcceptor: (1 - equilibriumBloch[2]) / 2,
  };
}

export function decoherenceMetrics({ gamma1PerPs, gammaPhiPerPs, couplingEv }) {
  const gamma1 = nonNegative(gamma1PerPs, "gamma1PerPs");
  const gammaPhi = nonNegative(gammaPhiPerPs, "gammaPhiPerPs");
  const h = nonNegative(couplingEv, "couplingEv");
  const gamma2 = gammaPhi + gamma1 / 2;
  const couplingFrequencyPs = (2 * h) / CONSTANTS.HBAR_EV_PS;
  return {
    gamma1PerPs: gamma1,
    gammaPhiPerPs: gammaPhi,
    gamma2PerPs: gamma2,
    t1Ps: gamma1 > 0 ? 1 / gamma1 : Infinity,
    t2Ps: gamma2 > 0 ? 1 / gamma2 : Infinity,
    couplingFrequencyPs,
    zeta: gamma2 > 0 ? couplingFrequencyPs / gamma2 : h > 0 ? Infinity : null,
    zetaStatus: gamma2 > 0 ? "finite" : h > 0 ? "unbounded" : "undefined",
  };
}

export function marcusBenchmark({ couplingEv, deltaG0Ev, overpotentialV, lambdaEv, temperatureK }) {
  const h = nonNegative(couplingEv, "couplingEv");
  const deltaG0 = finite(deltaG0Ev, "deltaG0Ev");
  const eta = finite(overpotentialV, "overpotentialV");
  const lambda = positive(lambdaEv, "lambdaEv");
  const temperature = positive(temperatureK, "temperatureK");
  const kT = CONSTANTS.KB_EV_K * temperature;
  const deltaGEv = deltaG0 - eta;
  const activationNumber = ((deltaGEv + lambda) ** 2) / (4 * lambda * kT);

  if (h === 0) {
    return { ratePerSecond: 0, logRate: -Infinity, deltaGEv, activationNumber };
  }

  const logPrefactor =
    Math.log((2 * Math.PI) / CONSTANTS.HBAR_EV_S) +
    2 * Math.log(h) -
    0.5 * Math.log(4 * Math.PI * lambda * kT);
  const logRate = logPrefactor - activationNumber;
  const ratePerSecond = logRate < -745 ? 0 : logRate > 709 ? Infinity : Math.exp(logRate);
  return { ratePerSecond, logRate, deltaGEv, activationNumber };
}

export function reservoirRates({ conductanceNs, quantumCapacitanceAf }) {
  const conductanceS = nonNegative(conductanceNs, "conductanceNs") * 1e-9;
  const capacitanceF = positive(quantumCapacitanceAf, "quantumCapacitanceAf") * 1e-18;
  const conductanceQuantumS =
    (CONSTANTS.ELEMENTARY_CHARGE_C ** 2) / CONSTANTS.PLANCK_J_S;
  return {
    conductanceS,
    capacitanceF,
    conductanceQuantumS,
    gcqPerSecond: conductanceS / capacitanceF,
    quantumRatePerSecond: conductanceQuantumS / capacitanceF,
  };
}

const addScaled = (vector, derivative, scale) => vector.map((value, i) => value + scale * derivative[i]);

function derivative(state, omegaVector, direction, equilibriumProjection, gamma1, gamma2) {
  const [x, y, z] = state;
  const [ox, oy, oz] = omegaVector;
  const cross = [oy * z - oz * y, oz * x - ox * z, ox * y - oy * x];
  const parallelScalar = x * direction[0] + y * direction[1] + z * direction[2];
  return state.map((value, index) => {
    const parallel = parallelScalar * direction[index];
    const transverse = value - parallel;
    const longitudinal = (parallelScalar - equilibriumProjection) * direction[index];
    return cross[index] - gamma2 * transverse - gamma1 * longitudinal;
  });
}

function rk4Step(state, dt, args) {
  const k1 = derivative(state, ...args);
  const k2 = derivative(addScaled(state, k1, dt / 2), ...args);
  const k3 = derivative(addScaled(state, k2, dt / 2), ...args);
  const k4 = derivative(addScaled(state, k3, dt), ...args);
  return state.map((value, i) => value + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

// Closed-form propagator of the same constant-coefficient Bloch ODE.
// Longitudinal relaxation commutes with transverse rotation/dephasing.
function analyticalState(timePs, twoState, decoherence) {
  const n = twoState.direction;
  const projection = n[2]; // Initial donor vector is [0,0,1].
  const transverse = n.map((component, i) => (i === 2 ? 1 : 0) - projection * component);
  const rotatedCross = [
    n[1] * transverse[2] - n[2] * transverse[1],
    n[2] * transverse[0] - n[0] * transverse[2],
    n[0] * transverse[1] - n[1] * transverse[0],
  ];
  const angle = twoState.omegaPs * timePs;
  const decay = Math.exp(-decoherence.gamma2PerPs * timePs);
  const longitudinal = twoState.equilibriumProjection +
    (projection - twoState.equilibriumProjection) * Math.exp(-decoherence.gamma1PerPs * timePs);
  return n.map((component, i) => longitudinal * component + decay *
    (transverse[i] * Math.cos(angle) + rotatedCross[i] * Math.sin(angle)));
}

export function propagateBloch({
  couplingEv,
  deltaEv,
  temperatureK,
  gamma1PerPs,
  gammaPhiPerPs,
  durationPs,
  steps,
  solver = "auto",
}) {
  const twoState = twoStateMetrics({ couplingEv, deltaEv, temperatureK });
  const decoherence = decoherenceMetrics({ gamma1PerPs, gammaPhiPerPs, couplingEv });
  const duration = positive(durationPs, "durationPs");
  const count = Math.max(1, Math.floor(positive(steps, "steps")));
  const dt = duration / count;
  if (!["auto", "rk4", "analytic"].includes(solver)) throw new RangeError("Unknown Bloch solver");
  const stepScale = dt * Math.max(twoState.omegaPs, decoherence.gamma1PerPs, decoherence.gamma2PerPs);
  if (!Number.isFinite(stepScale)) throw new RangeError("Propagation scale exceeds the numeric range");
  const method = solver === "auto" ? (stepScale > 0.1 ? "analytic" : "rk4") : solver;
  if (method === "rk4" && stepScale > 0.1) throw new RangeError("RK4 step too coarse: increase steps or use the analytical solver");
  const omegaVector = twoState.direction.map((component) => component * twoState.omegaPs);
  const args = [
    omegaVector,
    twoState.direction,
    twoState.equilibriumProjection,
    decoherence.gamma1PerPs,
    decoherence.gamma2PerPs,
  ];
  let state = [0, 0, 1];
  const points = [];
  const stride = Math.max(1, Math.ceil(count / 1500));
  let maxBlochNorm = 1;
  const warnings = [];
  if (solver === "auto" && method === "analytic") warnings.push("Analytical propagation used because the requested time step is too coarse for RK4.");
  if (twoState.omegaPs * dt * stride > Math.PI / 10) warnings.push("Plot sampling resolves fewer than 20 points per coherent period; visible oscillations may be aliased.");

  for (let i = 0; i <= count; i += 1) {
    if (method === "analytic") state = analyticalState(i * dt, twoState, decoherence);
    const norm = Math.hypot(...state);
    if (!Number.isFinite(norm) || norm > 1 + 1e-6) throw new RangeError("Bloch trajectory lost numerical physicality; refine the step or use the analytical solver");
    maxBlochNorm = Math.max(maxBlochNorm, norm);
    if (i % stride === 0 || i === count) {
      const timePs = i * dt;
      const rawAcceptor = (1 - state[2]) / 2;
      const unitary = twoState.mixing * Math.sin((twoState.omegaPs * timePs) / 2) ** 2;
      points.push({
        timePs,
        acceptorRaw: rawAcceptor,
        acceptorPlot: Math.max(0, Math.min(1, rawAcceptor)),
        unitary,
        blochNorm: norm,
      });
    }
    if (i < count && method === "rk4") state = rk4Step(state, dt, args);
  }

  return { points, finalBloch: state, dtPs: dt, steps: count, method, stepScale, maxBlochNorm, warnings, twoState, decoherence };
}

function chooseWindow(twoState, decoherence) {
  const candidates = [];
  if (Number.isFinite(twoState.periodPs)) candidates.push(6 * twoState.periodPs);
  if (Number.isFinite(decoherence.t2Ps)) candidates.push(4 * decoherence.t2Ps);
  if (Number.isFinite(decoherence.t1Ps)) candidates.push(3 * decoherence.t1Ps);
  return Math.min(20, Math.max(0.5, ...candidates));
}

function chooseSteps(durationPs, twoState, decoherence) {
  const times = [twoState.periodPs, decoherence.t1Ps, decoherence.t2Ps].filter(
    (value) => Number.isFinite(value) && value > 0,
  );
  const shortest = times.length ? Math.min(...times) : durationPs;
  return Math.max(1200, Math.min(24000, Math.ceil(durationPs / (shortest / 50))));
}

export function computeModel(parameters, options = {}) {
  const coupling = effectiveCoupling(parameters);
  const twoState = twoStateMetrics({
    couplingEv: coupling.couplingEv,
    deltaEv: parameters.deltaEv,
    temperatureK: parameters.temperatureK,
  });
  const decoherence = decoherenceMetrics({
    gamma1PerPs: parameters.gamma1PerPs,
    gammaPhiPerPs: parameters.gammaPhiPerPs,
    couplingEv: coupling.couplingEv,
  });
  const marcus = marcusBenchmark({
    couplingEv: coupling.couplingEv,
    deltaG0Ev: parameters.deltaG0Ev,
    overpotentialV: parameters.overpotentialV,
    lambdaEv: parameters.lambdaEv,
    temperatureK: parameters.temperatureK,
  });
  const reservoir = reservoirRates(parameters);
  const durationPs = options.durationPs ?? chooseWindow(twoState, decoherence);
  const steps = options.steps ?? chooseSteps(durationPs, twoState, decoherence);
  const dynamics = propagateBloch({
    couplingEv: coupling.couplingEv,
    deltaEv: parameters.deltaEv,
    temperatureK: parameters.temperatureK,
    gamma1PerPs: parameters.gamma1PerPs,
    gammaPhiPerPs: parameters.gammaPhiPerPs,
    durationPs,
    steps,
    solver: options.solver ?? "auto",
  });
  const warnings = [...dynamics.warnings];
  if (coupling.extrapolated) warnings.push("Distance is below the reference distance: coupling is extrapolated above its contact value, with no empirical support implied.");
  if (decoherence.zetaStatus === "undefined") warnings.push("Timescale ratio is undefined when coupling and transverse decay are both zero.");
  return { parameters: { ...parameters }, coupling, twoState, decoherence, marcus, reservoir, dynamics, warnings };
}
