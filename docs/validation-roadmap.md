# Validation roadmap

Status: proposed programme, 7 October 2026. Software verification is distinct from experimental and biological validation. No new empirical validation is claimed.

## Ranked work and gates

| Priority | Track | Work | Completion evidence |
|---:|---|---|---|
| 1 | Experimental | Audit raw data and select one physical observable | Traceable files, units, batches, replicates, controls and prior-use history; genuinely untouched conditions identified |
| 2 | Experimental | Freeze a protocol before test-data access | Model, observation mapping, parameter sources, baseline, grouped split and numeric acceptance criteria recorded |
| 3 | Software | Independently check constant-coefficient Bloch dynamics | Analytical trajectory comparison and scale-appropriate SI assertions pass; verification scope documented |
| 4 | Experimental | Implement the minimum measurement layer | Explicit current, charge or impedance equations with measured inputs and identifiable parameters |
| 5 | Experimental | Predict held-out conditions without retuning | Predictions, uncertainty, residuals, baseline comparison and failures archived |
| 6 | Experimental | Transfer across a second perturbation or batch | Same frozen parameterisation predicts another condition using only declared measured inputs |
| 7 | Biological | Add trapping/product/recombination and measurement layers | Proximal endpoint first; parameter constraints, controls and independent biological test |

## Available data audit

The tracked data/jain-2024-gnp100.json contains four linker conditions and published mean/SD summaries for linker length and a biological donor-charging proxy. It has already informed the comparison and Monte Carlo analysis. It is development evidence, not an untouched validation set. Replicate identifiers, batch information and a direct molecular-event-to-proxy mapping are absent from that file. SD must not be treated as standard error without replicate counts. Summary sampling is not mechanistic validation.

The repository tree inspected for this change contains no raw CV, EIS or chrono dataset. Existing laboratory data may be usable once provenance and prior use are audited; their availability or suitability is not established here.

## Measurement-layer requirements

- EIS: specify complex impedance, circuit topology, resistance and capacitance meanings, frequency coverage and parasitics. Effective fitted capacitance is not automatically quantum capacitance. Check alternative circuits and parameter identifiability.
- CV: specify electrode kinetics, potential convention, area, concentration, transport and capacitive current. Implement Butler–Volmer or Marcus–Hush–Chidsey only where the selected model requires it.
- Chrono: separate charging, faradaic transfer and mass transport; include instrument response where relevant.
- G/Cq is a characteristic inverse time. Matching it to a molecular rate does not identify a mechanism.

## Biological requirements

Specify occupancy-to-flux kinetics with trapping, product formation and recombination; active-site/loading and accessibility; flux-to-measurement response and background; then proximal-response-to-phenotype dynamics. Mark each parameter independently measured, calibrated or unidentifiable. Controls must address binding, uptake, loading, accessibility and assay interference where applicable. Cell viability alone does not identify an electron-transfer mechanism.

## Numerical scope and remaining issues

tests/bloch-reference.test.js compares RK4 with an independently expressed analytical solution of the documented constant-coefficient ODE at seven selected cases, including undamped, detuned, dephasing and degenerate limits. It checks raw population trajectories and final Bloch physicality. It does not verify the full UI domain, microscopic bath physics or empirical accuracy.

Remaining numerical work: test the declared UI domain and the automatic step cap; quantify convergence near stiff limits; explicitly document the simultaneous zero-coupling/zero-dephasing diagnostic (currently zeta returns Infinity although the ratio is 0/0); flag r < r0 extrapolation and overflow. These are open requirements, not corrected behaviours in this change.

## Scientific positioning gates

1. Verified implementation: independently checked equations and numerical limits.
2. Empirically supported physical model: held-out prediction in a specified observable/domain, credible baseline and constrained parameters.
3. Mechanistic support: a discriminating perturbation excludes plausible alternatives; fit quality alone is insufficient.
4. Biological prediction: separately validated observation model and held-out endpoints.

The most valuable manuscript panel is observed versus frozen predicted values with uncertainty, residuals and baseline performance. Release numbering alone confers no validation status.
