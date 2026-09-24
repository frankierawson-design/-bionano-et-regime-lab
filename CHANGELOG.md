# Changelog

All notable changes are recorded here.
## [0.2.2] - 2026-09-24

### Added

- Comprehensive browser-based user guide.
- Definitions of the principal electron-transfer parameters and diagnostics.
- Step-by-step instructions for using the modelling interface.
- Direct navigation between the software and user guide.

### Changed

- Expanded documentation of intended use, interpretation boundaries and known limitations.

### Scientific scope

- This documentation release does not introduce a new physical model or provide additional experimental validation.
- The Jain GNP100 comparison and Monte Carlo uncertainty analysis retain the interpretation boundaries documented in v0.2.1.

## [0.2.1] - 2026-09-23

### Added

- Fixed-seed, 100,000-draw Monte Carlo uncertainty propagation for the Jain GNP100 linker dataset.
- Versioned Monte Carlo summary output and compressed draw-level results.
- A reproducibility test that reruns the analysis twice and checks byte-for-byte identical outputs.
- An npm command, `npm run jain:gnp100:monte-carlo`, for reproducing the analysis.

- Versioned GNP100 polyethylene-glycol linker data from Jain et al. 2024.
- Executable comparison using the released effective-coupling and Marcus-benchmark functions.
- Separate independent and data-derived distance-decay comparisons.
- Versioned numerical results and an automated reproducibility test.
- Documentation of the observable mismatch and circularity boundary.

### Validation status

- The full automated suite now contains 12 tests; all 12 pass.
- The length-plus-rate uncertainty analysis gives median α = 0.17214 nm⁻¹, 95% interval 0.02099–0.40002 nm⁻¹ and P(α > 0) = 0.98343.
- This uncertainty propagation concerns published summary measurements and is not validation of a microscopic electron-transfer mechanism.

- The independent comparison gives χ² = 121.7002.
- The data-derived descriptive comparison gives χ² = 3.47185.
- These calculations reproduce the stated arithmetic but do not validate a microscopic mechanism.
## [0.2.0] - 2026-09-22

### Added

- Dependency-free browser interface.
- Distance-dependent coupling using an explicit rate-decay convention.
- Thermalising two-state Bloch propagation with fourth-order Runge-Kutta integration.
- Nonadiabatic Marcus benchmark evaluated in logarithmic form.
- Conductance-capacitance and conductance-quantum characteristic rates.
- Four illustrative scenarios and JSON export.
- Automated verification tests and continuous-integration workflow.
- Scientific method, reuse boundary and limitation documentation.

### Validation status

- Deterministic numerical checks implemented.
- Independent held-out experimental validation remains outstanding.
