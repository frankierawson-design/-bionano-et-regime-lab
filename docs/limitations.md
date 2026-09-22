# Limitations and interpretive boundaries

## Appropriate uses

- Checking units and the consequences of a parameter set.
- Designing discriminating perturbations before experiments.
- Teaching why mixing, decoherence, activation and reservoir response are not interchangeable.
- Providing a transparent baseline for higher-fidelity modelling.

## Unsupported claims

The software does **not**:

- establish quantum coherence or tunnelling;
- assign a dominant mechanism automatically;
- predict a cellular phenotype or treatment response;
- convert a microscopic rate directly into a current or biological endpoint;
- calculate local bipolar-electrode potential or ionic transport;
- replace molecular dynamics, Poisson-Nernst-Planck modelling, stochastic electron counting or independent experiments.

## Model omissions

The two-state model excludes bridge states, electrode continua, multiple orbitals and explicit nuclear coordinates. The bath is Markovian and phenomenological. `Gamma1` and `gamma_phi` are inputs rather than predictions from a spectral density. There is no acceptor trap, chemical product, recombination network or biological observation layer.

The Marcus benchmark omits adiabatic corrections, proton-coupled transfer, heterogeneous ensembles and Marcus-Hush-Chidsey electrode integration. Reusing one coupling value in the Hamiltonian and Marcus expressions is a modelling convenience, not evidence that both descriptions apply simultaneously.

The built-in scenarios are illustrative and were not fitted to experiments. Apparent numerical agreement between different rate scales does not demonstrate a shared physical mechanism.

## Validation status

The automated tests verify implementation consistency and limiting cases. They do not constitute empirical validation. A v1.0 claim requires independently fixed parameters, held-out data and a prespecified observation model linking molecular events to the measured experimental quantity.
