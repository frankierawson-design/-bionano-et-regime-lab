# Numerical verification follow-up

Date: 7 October 2026. Applies to the changes in PR #7, based on v0.2.4. This report verifies implementation of the stated reduced-order equations; it does not establish experimental accuracy or biological prediction.

## Failure found and correction

The original automatic RK4 calculation reached its 24,000-step cap at the allowed UI corner h0 = 100 meV, r = 0.1 nm, r0 = 2 nm and beta = 2 inverse angstrom (other values from the QBET nanogap scenario). Its final Bloch vector was NaN. The exponential distance law yields approximately 1.78e7 eV at this extrapolated corner: numerical permission is not physical plausibility.

Automatic propagation now switches to the exact constant-coefficient Bloch solution when dt times the largest angular frequency or decay rate exceeds 0.1. Explicit coarse RK4 requests fail clearly. The Hamiltonian and relaxation equations are unchanged; the propagator changes. Every computed step is checked for finite Bloch norm and norm <= 1 + 1e-6. Plot sampling below 20 points per coherent period carries an aliasing warning; exact point values do not make an under-resolved plot informative.

Distance below r0 is flagged as extrapolation. Negative distances and coupling overflow are rejected. Zero coupling bypasses the exponential to avoid 0 times Infinity. The simultaneous zero-coupling/zero-transverse-decay ratio is null with status `undefined`; nonzero coupling over zero decay remains Infinity with status `unbounded`.

Invalid UI input clears displayed results and disables export. Exports include solver metadata, trajectory and warnings, and encode numeric infinities as strings. Consumers must handle the documented encoding and zeta status.

## Reproducible evidence

Run `npm run check` with Node >=20. The completed local run passed all 34 tests and syntax checks.

- Seven independently expressed analytical reference cases cover degenerate, detuned, undamped, relaxation and dephasing limits. Both RK4 and explicit analytical propagation are checked.
- An elementary resonant solution independently checks the analytical solver and fourth-order RK4 convergence at 64, 128 and 256 steps; error reduction must be between 15 and 17 on each doubling.
- The UI-domain audit reads the 13 actual declared input bounds. It covers four scenarios, 26 individual boundary substitutions, 24 high-extrapolation/zero-decay corners and 128 fixed-seed random samples: 182 cases in total. Result: 35 RK4 and 147 analytical cases, all checked quantities finite and all trajectories physical within the declared tolerances.
- Regression checks cover the step cap, undefined ratio, distance/overflow guards, coarse-step rejection, stale export prevention and JSON diagnostic encoding.
- The existing deterministic GNP100 comparison and Monte Carlo reproducibility checks remain passing.

This finite sample is not exhaustive verification of the continuous 13-dimensional domain. The 0.1 switching criterion is a conservative numerical guard, not a universal error guarantee. Floating-point phase accuracy at extreme frequencies and plot resolution remain limitations. An exact propagator is specific to the current constant coefficients and initial donor state; any time-dependent extension needs new verification.

## Evidence still required

No held-out experiment was performed. The repository's four-condition Jain GNP100 summary has already informed development and lacks the raw traces, replicate/batch identities and observation mapping needed for the proposed validation. It cannot be relabelled as independent held-out evidence. Raw CV/EIS/chrono traces or new independent data, provenance, a frozen protocol and identifiable observation model are required next. See the validation roadmap, protocol template and observation-model specification.
