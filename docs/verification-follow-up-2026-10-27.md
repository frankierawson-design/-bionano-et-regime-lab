# Verification follow-up, 27 October 2026

The implementation audit of main commit `f0cc3844ef01e386fd49d76d51c64d66f528ba67` reran 50 Node tests successfully. Separately constructed density-matrix reference calculations passed 140 Bloch solver runs over 70 parameter sets. Independent SI checks passed 100 coupling, Marcus and reservoir parameter sets. These are finite numerical implementation checks, not independent experimental or biological validation.

The advertised Python command exposed a reproducibility defect. A loop reused the argparse namespace name `args` for a simulation dictionary, so writing `args.output` raised an AttributeError. The dictionary now has its own name. The unchanged numerical assertions and report output both complete. CI installs the narrowly scoped, pinned NumPy/SciPy requirements, runs this comparison and requires a saved report artifact.

The corrected surface verification gave maximum occupancy errors of approximately 3.37e-5, 8.43e-6, 2.11e-6 and 5.27e-7 at 500, 1000, 2000 and 4000 intervals. Error ratios were approximately four. Maximum integrated charge discrepancy was 2.07e-25 C. These checks apply to the stated triangular-potential example.

Both Jain analysis scripts now read `softwareVersion` from package.json. They also record `codeCommit`, `sourceTreeDirty` and `sourcePaths`. The commit identifies Git HEAD, while the dirty flag explicitly records modifications or untracked inputs under package.json, src, scripts and data. Results and documentation are excluded from that flag. A non-Git source archive, including one placed inside an unrelated repository, reports null for commit and dirty status. The numerical algorithms, random seed and reference values are unchanged. Existing committed result files remain historical snapshots until deliberately regenerated.

Two new integration tests cover clean/modified source provenance, package-version changes, generated-output exclusion and missing/unrelated Git metadata. The complete Node suite now contains 52 tests. Historical reports listing 34 or 40 tests describe their earlier scope.

Reproduce from the repository root with Node >=20 and Python 3.12:

```bash
npm run check
python -m pip install -r scripts/requirements-verification.txt
python scripts/verify-surface-cv.py --module src/electrode-kinetics.js --output verification/surface-model.json
```

Local checks used Node 24.22.1, Python 3.12.14, NumPy 2.3.5 and SciPy 1.17.0. GitHub CI targets Node 20 and Python 3.12. The source corrections do not change the scientific model or validate diagnostic regime boundaries. The archived release tag and Pages deployment source remain unchanged.
