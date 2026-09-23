import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const SEED = 20260905;
const DRAWS = 100_000;

// Published GNP100 summary values from Jain et al.
// https://doi.org/10.1038/s41565-023-01496-y
const observations = [
  {
    pegKDa: 1.0,
    lengthNm: 2.70,
    lengthSdNm: 2.08,
    ratePerSecond: 1.9416e-5,
    rateSdPerSecond: 4.1139e-6,
  },
  {
    pegKDa: 2.0,
    lengthNm: 3.80,
    lengthSdNm: 2.69,
    ratePerSecond: 1.6213e-5,
    rateSdPerSecond: 1.5644e-6,
  },
  {
    pegKDa: 3.5,
    lengthNm: 7.15,
    lengthSdNm: 2.69,
    ratePerSecond: 4.1953e-6,
    rateSdPerSecond: 1.8529e-6,
  },
  {
    pegKDa: 5.0,
    lengthNm: 10.70,
    lengthSdNm: 1.69,
    ratePerSecond: 4.2494e-6,
    rateSdPerSecond: 1.4035e-6,
  },
];

// Fixed-seed pseudorandom-number generator.
function mulberry32(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller transformation for Gaussian samples.
function normalSampler(random) {
  let spare;

  return (mean, standardDeviation) => {
    if (spare !== undefined) {
      const z = spare;
      spare = undefined;
      return mean + standardDeviation * z;
    }

    let u1 = 0;

    while (u1 === 0) {
      u1 = random();
    }

    const u2 = random();
    const radius = Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;

    spare = radius * Math.sin(angle);

    return (
      mean +
      standardDeviation * radius * Math.cos(angle)
    );
  };
}

// Rejects impossible non-positive Gaussian samples.
function positiveNormal(normal, mean, standardDeviation) {
  let value;

  do {
    value = normal(mean, standardDeviation);
  } while (!(value > 0) || !Number.isFinite(value));

  return value;
}

// Fits ln(rate) = intercept - alpha × length.
function apparentDecayCoefficient(lengths, rates) {
  const logRates = rates.map(Math.log);

  const meanLength =
    lengths.reduce((sum, value) => sum + value, 0) /
    lengths.length;

  const meanLogRate =
    logRates.reduce((sum, value) => sum + value, 0) /
    logRates.length;

  let numerator = 0;
  let denominator = 0;

  for (let index = 0; index < lengths.length; index += 1) {
    const dx = lengths[index] - meanLength;

    numerator +=
      dx * (logRates[index] - meanLogRate);

    denominator += dx * dx;
  }

  return -numerator / denominator;
}

function quantile(sortedValues, probability) {
  const position =
    (sortedValues.length - 1) * probability;

  const lower = Math.floor(position);
  const fraction = position - lower;

  const upper = Math.min(
    lower + 1,
    sortedValues.length - 1,
  );

  return (
    sortedValues[lower] * (1 - fraction) +
    sortedValues[upper] * fraction
  );
}

function summarise(values) {
  const sorted = [...values].sort(
    (a, b) => a - b,
  );

  return {
    draws: values.length,
    medianAlphaNmInverse: quantile(sorted, 0.5),
    lower95AlphaNmInverse: quantile(sorted, 0.025),
    upper95AlphaNmInverse: quantile(sorted, 0.975),
    probabilityAlphaGreaterThanZero:
      values.filter((value) => value > 0).length /
      values.length,
  };
}

const random = mulberry32(SEED);
const normal = normalSampler(random);

const fixedLengths = observations.map(
  (point) => point.lengthNm,
);

const rateOnly = new Array(DRAWS);
const lengthAndRate = new Array(DRAWS);

for (let draw = 0; draw < DRAWS; draw += 1) {
  const sampledRatesOnly = observations.map(
    (point) =>
      positiveNormal(
        normal,
        point.ratePerSecond,
        point.rateSdPerSecond,
      ),
  );

  rateOnly[draw] = apparentDecayCoefficient(
    fixedLengths,
    sampledRatesOnly,
  );

  const sampledLengths = observations.map(
    (point) =>
      positiveNormal(
        normal,
        point.lengthNm,
        point.lengthSdNm,
      ),
  );

  const sampledRates = observations.map(
    (point) =>
      positiveNormal(
        normal,
        point.ratePerSecond,
        point.rateSdPerSecond,
      ),
  );

  lengthAndRate[draw] =
    apparentDecayCoefficient(
      sampledLengths,
      sampledRates,
    );
}

const summary = {
  analysis:
    "Jain et al. GNP100 apparent distance-decay uncertainty analysis",

  softwareVersion: "0.2.1",

  sourceDoi:
    "https://doi.org/10.1038/s41565-023-01496-y",

  seed: SEED,

  randomNumberGenerator:
    "Mulberry32 with Box-Muller Gaussian transformation",

  drawsPerScenario: DRAWS,

  fit:
    "Unweighted ordinary least squares of ln(r_d) = intercept - alpha * length",

  sampling: {
    independence:
      "Published length and rate uncertainties sampled independently",

    distributions:
      "Gaussian using published means and SD values",

    truncation:
      "Non-positive or non-finite sampled lengths and rates rejected and resampled",
  },

  scenarios: {
    rateOnly: summarise(rateOnly),
    lengthAndRate: summarise(lengthAndRate),
  },

  interpretation:
    "This propagates published summary uncertainties. It is not a stochastic electron-transfer simulation and does not validate a microscopic mechanism.",
};

const csvRows = [
  "draw,alpha_rate_only_nm_inverse,alpha_length_and_rate_nm_inverse",
];

for (let draw = 0; draw < DRAWS; draw += 1) {
  csvRows.push(
    `${draw + 1},` +
      `${rateOnly[draw].toPrecision(17)},` +
      `${lengthAndRate[draw].toPrecision(17)}`,
  );
}

await mkdir(
  new URL("../results/", import.meta.url),
  { recursive: true },
);

await writeFile(
  new URL(
    "../results/jain-2024-gnp100-monte-carlo-summary.json",
    import.meta.url,
  ),
  `${JSON.stringify(summary, null, 2)}\n`,
);

await writeFile(
  new URL(
    "../results/jain-2024-gnp100-monte-carlo-draws.csv.gz",
    import.meta.url,
  ),
  gzipSync(`${csvRows.join("\n")}\n`, {
    level: 9,
  }),
);

console.log(JSON.stringify(summary, null, 2));