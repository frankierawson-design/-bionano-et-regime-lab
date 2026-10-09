# Minimum observation-model specification

Status: proposed implementation contract, not an implemented or fitted biological model. Start with one measured physical observable and one proximal biological endpoint. Do not fit every layer simultaneously to a final phenotype.

## Ranked next deliverables

| Order | Small deliverable | Gate / evidence |
|---:|---|---|
| 1 | One raw-data manifest | File checksum, source, units, timestamps, replicate, batch, condition, controls, prior use and exclusion reasons; an untouched test group must exist |
| 2 | Freeze one observable and its mapping | Measurement equation, parameter units/sources, noise, instrument response, baseline, grouped holdout, numeric success threshold selected before opening test data |
| 3 | Test identifiability on development data | Sensitivity/profile or posterior assessment; report parameter combinations that cannot be separated; reduce or independently constrain them |
| 4 | Archive frozen test predictions | Code/parameter/data versions, uncertainty coverage, residuals and baseline comparison; report failures without retuning |
| 5 | Test a discriminating perturbation | Predict a second batch or condition with independently measured changes; plausible rival mechanisms make different predictions |
| 6 | Introduce proximal biological kinetics | Calibrated trapping/product/recombination and assay response, followed by a separate held-out test |

## Physical measurement contract

For each chosen observable document an equation connecting measured current I(t), charge Q(t), or complex impedance Z(omega) to the model. A population P_A alone is dimensionless and is not a current or biological response.

If using a population-derived charge, Q(t) = N_active q P_A(t) is only a candidate mapping for a defined ensemble with known initialisation and charge per event; I(t) = dQ/dt additionally needs instrument response, background and transport. It is not a steady-state catalytic-current model. For EIS define an actual circuit or linearised kinetic impedance and show parameter identifiability; fitted total capacitance must not silently become Cq. For CV and chrono include electrode area, concentration/loading, potential convention, charging and transport as appropriate. The present G/Cq comparison supplies a timescale, not those measurement equations.

## Biological kinetic contract

For a sustained flux endpoint, specify populations or concentrations for donor, acceptor, trapped state and product, with source/replenishment, transfer, back-transfer, trapping, recombination and product formation. Check non-negativity and mass/charge balance with each source and sink explicitly accounted for. If coherent dynamics is retained, extend the density-matrix model consistently to sinks rather than arbitrarily adding a sink to a probability trace.

A candidate assay observation is y(t) = b(t) + alpha times product(t), convolved with a measured instrument/assay response where needed. This equation is a hypothesis: establish calibration range, background, detection limits, saturation, interference and uncertainty. Loading, uptake, accessibility and active fraction must be measured or constrained. Product formation and phenotype require distinct observation models and distinct validation gates.

## Parameter ledger and controls

For every parameter record symbol, units, admissible range, source and uncertainty, status (independently measured / calibrated on development data / fixed assumption / unidentifiable), and whether it may vary between conditions. Never refit test-specific parameters after observing the test endpoint. Include inactive/no-transfer material, matched loading/binding/uptake, blank assay and interference controls as appropriate to the actual experiment. Select controls that distinguish the proposed mechanism from alternatives.

## What changes the scientific claim

A frozen model beating a credible baseline on independent raw data, with meaningful uncertainty and constrained parameters, supports a specified empirical domain. A successfully predicted discriminating perturbation adds mechanistic support. A separately tested biological observation model supports only its measured endpoints and conditions. Code checks, development-set fits, Monte Carlo draws from published summaries and release numbering do not establish these claims.

## Implemented surface-electrode extension

See [CV peak analysis and surface kinetics](cv-peak-kinetics.md) for a separate Butler–Volmer occupancy/current API and verified illustrative simulations. It assumes a noninteracting surface-confined couple and does not map the Bloch population directly to current. Archived CV screening has not established a defensible redox-pair assignment or fitted k0; calibration and independent-sample validation remain outstanding.
