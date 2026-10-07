# Held-out validation protocol

Status: template, not a preregistration or completed experiment. Complete all fields before accessing test responses. Retain dated versions and file hashes.

## Freeze record

- Protocol identifier, date, responsible reviewer:
- Code commit and environment:
- Primary observable, units and tested domain:
- Dataset files/hashes, provenance, permissions and integrity checks:
- Prior inspection/use of each dataset or condition:
- Experimental units, batches, independent replicates and technical repeats:
- Calibration groups and untouched test groups; rationale for leakage-free split:

## Model and constraints

- Equations and observation mapping:
- Parameter table: name/unit, value or distribution, source, measured/calibrated/fixed status:
- Identifiability assessment and sensitivity analysis:
- Baseline model, fitted using calibration data only:
- Calibration objective and fitting procedure:
- Measurement and parameter uncertainty; correlated errors and replicate hierarchy:
- Required controls and exclusions defined without inspecting test outcomes:

## Success criteria (set numeric thresholds before test access)

- Primary error metric and units:
- Maximum acceptable error and scientific justification:
- Required performance relative to the baseline:
- Prediction interval coverage target, test-set size and coverage uncertainty:
- Permitted residual structure and checks:
- Rule for inconclusive results with inadequate power or identifiability:

For EIS specify real and imaginary residuals and weighting, not magnitude alone. For curves report both condition-level and point-level errors; correlated points are not independent experimental replicates.

## Locked evaluation and report

Save predictions before revealing test responses. No retuning after evaluation; revised models require a new test set. Archive inputs, frozen parameters, predictions, observations, uncertainty, residuals and comparator results. Report all failures and restrict conclusions to tested conditions. Produce an observed/predicted figure plus residuals and a limitations paragraph.
