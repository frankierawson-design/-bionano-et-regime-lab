# Changelog

All notable changes are recorded here.

## [0.3.0] - 2026-10-10

### Changed

- Added a surface-confined Butler–Volmer electrode module, CV example, archived-CV screening scripts and independent SciPy reference comparison. The full suite now contains 40 tests. The module is not exposed in the browser Explorer.

- Added an exact constant-coefficient Bloch fallback, coarse-RK4 rejection, trajectory physicality checks and extrapolation/plot-sampling warnings.
- Distinguished undefined zero-coupling/zero-transverse-decay ζ from an unbounded ratio; blocked stale exports after invalid input and documented non-finite JSON encoding.
- Added a ranked validation roadmap, held-out protocol template, numerical verification report and proposed physical/biological observation-model specification.
- Extended verification to 34 tests, including analytical references, RK4 convergence and 182 deterministic UI-domain cases; CI now runs syntax checks and tests together.
- Added optional clean-checkout commit provenance and aligned exports and citation metadata with v0.3.0 (DOI 10.5281/zenodo.23273881).

### Scientific scope

- The Hamiltonian and relaxation equations are unchanged. Numerical verification does not establish experimental accuracy, a microscopic mechanism or biological prediction.
- No held-out experiment or fitted biological observation model is claimed. GNP100 summaries remain development evidence.

## [0.2.4] - 2026-10-03

### Changed

- Included the citation corrections made after the v0.2.3 tag in this documentation release.
- Labelled the v0.2.3 archive explicitly wherever its DOI is retained as a historical citation.
- Aligned the application, JSON export and package version at v0.2.4.

### Citation

- Reserved [10.5281/zenodo.23122075](https://doi.org/10.5281/zenodo.23122075) before tagging and included it in CITATION.cff, CodeMeta, README and both user-guide citation links.
- Preserved the v0.2.3 tag and archive.

### Scientific scope

- No scientific model or numerical calculation changed.
- No new experimental validation is claimed.

## [0.2.3] - 2026-10-02

### Changed

- Published a metadata and documentation consistency release from the corrected `main` state.
- Aligned the application, package metadata, citation instructions and release notes at v0.2.3.
- Preserved v0.2.2 and its archive unchanged.

### Scientific scope

- No scientific model or numerical calculation changed.
- No new experimental validation is claimed.
- Zenodo archived v0.2.3 as [10.5281/zenodo.23104009](https://doi.org/10.5281/zenodo.23104009); the version DOI is recorded in the citation metadata.

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
