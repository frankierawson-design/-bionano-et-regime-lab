# Contributing

Contributions that improve correctness, reproducibility, accessibility or documentation are welcome.

## Before opening a change

1. Open an issue describing the physical assumption, software problem or proposed extension.
2. State the units and sign conventions for every new quantity.
3. Separate calculations that describe different observables or coarse-graining levels.
4. Add tests with analytically checkable limits or independently specified reference values.
5. Run `npm test` and describe any change in expected outputs.

## Scientific changes

Changes to equations require a primary citation and a test that distinguishes the new implementation from the previous one. A good numerical fit alone is not evidence that a mechanism is correct.

## Reporting problems

Please include the selected scenario, exported JSON input, browser and version, observed result and expected result. Do not include confidential or identifiable experimental data in public issues.
