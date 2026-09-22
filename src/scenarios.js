export const scenarios = Object.freeze({
  qbetNanogap: {
    name: "QBET nanogap",
    description: "Short, weakly detuned barrier with coherent access before dephasing.",
    parameters: {
      h0MeV: 50,
      r0Nm: 0.5,
      rNm: 0.8,
      betaRatePerAngstrom: 0.3,
      deltaEv: -0.02,
      deltaG0Ev: -0.2,
      overpotentialV: 0,
      lambdaEv: 0.2,
      temperatureK: 298,
      gamma1PerPs: 1,
      gammaPhiPerPs: 5,
      conductanceNs: 4,
      quantumCapacitanceAf: 10
    }
  },
  weakLinker: {
    name: "Weakly coupled linker",
    description: "Longer barrier illustrating exponential rate suppression and weak mixing.",
    parameters: {
      h0MeV: 30,
      r0Nm: 0.5,
      rNm: 1.5,
      betaRatePerAngstrom: 0.7,
      deltaEv: 0.08,
      deltaG0Ev: -0.1,
      overpotentialV: 0,
      lambdaEv: 0.4,
      temperatureK: 298,
      gamma1PerPs: 0.5,
      gammaPhiPerPs: 3,
      conductanceNs: 1,
      quantumCapacitanceAf: 25
    }
  },
  decoherenceLimited: {
    name: "Decoherence-limited interface",
    description: "Moderate coupling with fast phase loss and incomplete site mixing.",
    parameters: {
      h0MeV: 35,
      r0Nm: 0.5,
      rNm: 0.7,
      betaRatePerAngstrom: 0.4,
      deltaEv: 0.06,
      deltaG0Ev: -0.15,
      overpotentialV: 0,
      lambdaEv: 0.35,
      temperatureK: 310,
      gamma1PerPs: 2,
      gammaPhiPerPs: 25,
      conductanceNs: 8,
      quantumCapacitanceAf: 50
    }
  },
  reservoirLimited: {
    name: "Reservoir-limited nano-BPE",
    description: "Fast molecular benchmark paired with a much slower conductance-capacitance scale.",
    parameters: {
      h0MeV: 40,
      r0Nm: 0.5,
      rNm: 0.85,
      betaRatePerAngstrom: 0.3,
      deltaEv: -0.03,
      deltaG0Ev: -0.25,
      overpotentialV: -0.05,
      lambdaEv: 0.3,
      temperatureK: 298,
      gamma1PerPs: 1,
      gammaPhiPerPs: 6,
      conductanceNs: 0.001,
      quantumCapacitanceAf: 1000
    }
  }
});
