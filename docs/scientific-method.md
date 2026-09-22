# Scientific method and conventions

## 1. Distance-dependent coupling

The user-facing coefficient `beta_k` is a **rate-decay coefficient**. The electronic coupling is

```text
H_DA(r) = H0 exp[-beta_k (r-r0)/2].
```

Consequently, a weak-coupling rate proportional to `|H_DA|^2` decays as `exp[-beta_k(r-r0)]`. This explicit factor of one-half prevents insertion of a rate-derived decay coefficient directly into the coupling amplitude.

## 2. Two-state Hamiltonian

With `Delta epsilon = epsilon_A - epsilon_D` and donor occupancy represented by `r_z=+1`, the mean-free Hamiltonian is

```text
H = [[-Delta epsilon/2, H_DA],
     [H_DA, +Delta epsilon/2]].
```

The energy splitting and Hamiltonian mixing amplitude are

```text
E = sqrt[(Delta epsilon)^2 + 4 H_DA^2]
M = 4 H_DA^2 / E^2.
```

`M` is not a measured yield or the probability that a mechanism is quantum.

## 3. Thermalising Bloch dynamics

The Bloch vector is propagated according to

```text
dr/dt = Omega x r - Gamma2 r_perp
        - Gamma1[(r.n)-s_eq] n,

Gamma2 = gamma_phi + Gamma1/2,
s_eq = -tanh[E/(2 k_B T)].
```

Here `n=(2H_DA, 0, -Delta epsilon)/E`, `Omega=(E/hbar)n`, and `P_A=(1-r_z)/2`. Integration uses fourth-order Runge-Kutta. This is a phenomenological Markovian model rather than a microscopic spectral-density calculation.

## 4. Marcus benchmark

The local driving force is `Delta G = Delta G0 - eta` when energies are expressed in eV and overpotential in V. The nonadiabatic classical-nuclear benchmark is

```text
k_M = (2 pi / hbar) |H_DA|^2 / sqrt(4 pi lambda k_B T)
      exp[-(Delta G + lambda)^2/(4 lambda k_B T)].
```

The exponential is evaluated in logarithmic form. This expression assumes weak coupling, one effective reorganisation energy and classical harmonic nuclear coordinates.

## 5. Reservoir scales

The interface reports

```text
k_RC = G/C_q
k_Q  = (e^2/h)/C_q.
```

These are characteristic inverse times, not molecular transfer rates. Their interpretation depends on contacts, transmission, degeneracy, electrostatic capacitance and parasitic elements.

## 6. Diagnostics

```text
zeta = (2 H_DA/hbar)/Gamma2
A = (Delta G + lambda)^2/(4 lambda k_B T).
```

`zeta=1` and `A=1` are reference equalities, not learned or experimentally validated regime boundaries.
