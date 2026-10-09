# CV peak analysis and surface electrode kinetics

This extension adds a potential-dependent surface redox model and a descriptive
screen of the archived porphyrin CVs. No experimental rate constant has been
fitted, no biological observation model has been calibrated, and no independent
experimental prediction has been tested. The existing molecular/Bloch model is
unchanged. These are unreleased additions after v0.2.4.

## Surface redox model

For a noninteracting surface-confined couple, theta is the reduced fraction.
With x = n F (E - E0) / (R T),

```
k_red = k0 exp(-alpha x)
k_ox  = k0 exp((1-alpha) x)
dtheta/dt = k_red (1-theta) - k_ox theta
I_F = -Q_total dtheta/dt
I_C = C_dl dE/dt
```

Positive current is anodic. `Q_total = n F A Gamma_total` is the full redox
charge in coulombs. This parameterisation does not independently identify area
and loading. The surface `k0` has units s^-1. It is not a solution-phase
heterogeneous rate constant in m/s, a Marcus donor-acceptor rate, or the Bloch
population. `n`, `alpha`, temperature and formal potential are explicit inputs.
No mapping between these rate constants is assumed.

`src/electrode-kinetics.js` advances occupancy by the exact solution at each
interval's midpoint potential. Constant-potential propagation is exact; a
changing potential requires timestep refinement. Faradaic currents are interval
averages calculated from occupancy changes, so integrated current and charge
balance agree. Charging current is reported separately. Surface confinement,
noninteracting sites and a single couple are assumptions. There is no diffusion,
solution resistance, potential distribution, catalysis or optical mapping.
Rejecting overflow does not make extreme user inputs physically meaningful.

Run `npm run cv:example` to write three illustrative CV curves. This is a model
API and script extension; it is not integrated into the browser Explorer UI.

## Archived CV feature screen

`scripts/cv-peak-screening.py` reads 32 original workbooks (four labels, eight
rates from 10 to 1000 mV/s) from the archived porphyrin analysis package. Use:

```
python scripts/cv-peak-screening.py --source /path/to/porphyrin --output cv-peaks
```

The Python analysis additionally requires NumPy, SciPy, pandas, openpyxl and
Matplotlib; the archived environment pins are in `scripts/requirements-cv.txt`.
These dependencies are separate from the dependency-free browser calculation.

Original applied potential, time and current columns are used. The first full
descending and ascending sweeps are kept; a short terminal reverse segment is
excluded. PBS and AuNPs subtraction uses interpolation on the matching sweep
direction, not sorted points from an entire cyclic trace. These are separately
measured controls and subtraction is a sensitivity analysis, not an established
physical baseline.

Candidate local extrema are screened with third-order Savitzky-Golay windows
of 11, 31 and 61 points. Prominence must exceed 5 nA or 2% of the smoothed
interior branch range, whichever is larger. Features within 0.1 V of the
negative endpoint or 0.15 V of the positive endpoint are excluded. The strongest
raw local extremum in exploratory cathodic [-0.9,-0.2] V and anodic [-0.2,0.5] V
regions is tabulated, without automatic pairing. Selection can switch between
features; missing entries are detector exclusions, not proof of absent redox.

Broad features occur in PBS and bare gold, and control subtraction changes
positions, shapes and polarities. For the 31-point screen, anodic shifts over
200-1000 mV/s are 35.8 mV/decade for AuNPs+Por and 40.9 mV/decade for AuNPs.
They are descriptive slopes, not Laviron fits. Under an assumed one-electron,
298.15 K high-overpotential Laviron model, positive anodic slopes must exceed
59.2 mV/decade for 0 < alpha < 1. These selected slopes do not satisfy that
assumed limit. A different electron number or regime would change the test;
neither is established here. A uniquely assigned, consistently tracked redox
couple has not been established by this screen, so no k0 is reported.

Reference identity is unresolved for this scan-rate series. A stable unknown
reference offset alone would not prevent peak-separation analysis, but would
prevent assigning absolute molecular redox energies. Chemistry, temperature,
surface confinement versus diffusion, uncompensated resistance and replicate
provenance require checking before a kinetic inference. This conclusion concerns
these exported records, not every dataset or the original published study.

## Verification and references

The six new Node tests check constant-potential analytical propagation, Nernst
equilibrium, zero kinetics with charging, charge conservation, the reversible
surface peak-current limit and invalid domains. The full suite passed 40 tests.

An independently coded SciPy DOP853 reference for a triangular potential gave
maximum occupancy errors 3.37e-5, 8.43e-6, 2.11e-6 and 5.27e-7 with 500, 1000,
2000 and 4000 intervals. Successive error ratios were approximately four,
consistent with second-order midpoint propagation. Maximum integrated charge
discrepancy was 2.07e-25 C. This is finite-case numerical verification, not a
domain-wide error bound or experimental validation.

Reproduce the independent ODE comparison using
`python scripts/verify-surface-cv.py --module src/electrode-kinetics.js`.

- Laviron E. General expression of the linear potential sweep voltammogram in
  the case of diffusionless electrochemical systems. J Electroanal Chem 101
  (1979) 19-28. https://doi.org/10.1016/S0022-0728(79)80075-3
- Nicholson RS. Theory and application of cyclic voltammetry for measurement
  of electrode reaction kinetics. Anal Chem 37 (1965) 1351-1355.
  https://doi.org/10.1021/ac60230a016

Laviron and Nicholson apply to different physical regimes. Neither should be
applied to an arbitrary peak pair solely because it produces a numerical rate.
