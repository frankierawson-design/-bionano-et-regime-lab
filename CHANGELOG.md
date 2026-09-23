# Changelog

All notable changes are recorded here.

## [0.2.1] - 2026-09-23

### Added

- Versioned GNP100 polyethylene-glycol linker data from Jain et al. 2024.
- Executable comparison using the released effective-coupling and Marcus-benchmark functions.
- Separate independent and data-derived distance-decay comparisons.
- Versioned numerical results and an automated reproducibility test.
- Documentation of the observable mismatch and circularity boundary.

### Validation status

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
