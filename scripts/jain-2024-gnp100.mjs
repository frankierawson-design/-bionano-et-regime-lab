import { readFile, mkdir, writeFile } from "node:fs/promises";
import {
  effectiveCoupling,
  marcusBenchmark,
} from "../src/model.js";

const dataFile = new URL(
  "../data/jain-2024-gnp100.json",
  import.meta.url,
);

const resultsDirectory = new URL("../results/", import.meta.url);

const resultsFile = new URL(
  "../results/jain-2024-gnp100-results.json",
  import.meta.url,
);

const dataset = JSON.parse(
  await readFile(dataFile, "utf8"),
);

const fixed = Object.freeze({
  h0MeV: 50,
  r0Nm: 0.5,
  deltaG0Ev: -0.2,
  overpotentialV: 0,
  lambdaEv: 0.2,
  temperatureK: 310,
});

function analyse(label, betaRatePerAngstrom) {
  const reference = dataset.data[0];

  const referenceCoupling = effectiveCoupling({
    h0MeV: fixed.h0MeV,
    r0Nm: fixed.r0Nm,
    rNm: reference.lengthNm,
    betaRatePerAngstrom,
  }).couplingEv;

  const rows = dataset.data.map((point) => {
    const coupling = effectiveCoupling({
      h0MeV: fixed.h0MeV,
      r0Nm: fixed.r0Nm,
      rNm: point.lengthNm,
      betaRatePerAngstrom,
    });

    const predictedRate =
      reference.ratePerSecond *
      (coupling.couplingEv / referenceCoupling) ** 2;

    const residualStandardDeviations =
      (point.ratePerSecond - predictedRate) /
      point.rateSd;

    const marcus = marcusBenchmark({
      couplingEv: coupling.couplingEv,
      deltaG0Ev: fixed.deltaG0Ev,
      overpotentialV: fixed.overpotentialV,
      lambdaEv: fixed.lambdaEv,
      temperatureK: fixed.temperatureK,
    });

    return {
      ...point,
      couplingMeV: coupling.couplingMeV,
      predictedRatePerSecond: predictedRate,
      residualStandardDeviations,
      marcusRatePerSecond: marcus.ratePerSecond,
    };
  });

  return {
    label,
    betaRatePerAngstrom,
    chiSquare: rows.reduce(
      (total, row) =>
        total +
        row.residualStandardDeviations ** 2,
      0,
    ),
    rows,
  };
}

const blind = analyse(
  "Independent Page-Moser-Chen-Dutton coefficient",
  1.382,
);

const descriptive = analyse(
  "Data-derived Jain apparent slope",
  0.023,
);

const shortestMarcusRate =
  descriptive.rows[0].marcusRatePerSecond;

const shortestObservedProxy =
  dataset.data[0].ratePerSecond;

const output = {
  softwareVersion: "0.2.1",
  sourceSoftwareFunctions: [
    "effectiveCoupling",
    "marcusBenchmark",
  ],
  sourceDataset: dataset.source,
  fixedParameters: fixed,
  blind,
  descriptive,
  shortestLinkerComparison: {
    marcusRatePerSecond: shortestMarcusRate,
    observedBiologicalProxyPerSecond:
      shortestObservedProxy,
    differenceOrdersOfMagnitude: Math.log10(
      shortestMarcusRate / shortestObservedProxy,
    ),
  },
  interpretation: {
    blind:
      "Independent shape comparison; amplitude anchored to the shortest-linker observation.",
    descriptive:
      "Circular descriptive comparison because the slope was estimated from the same data.",
    boundary:
      "The microscopic Marcus benchmark and biological charging proxy are different observables.",
  },
};

await mkdir(resultsDirectory, { recursive: true });

await writeFile(
  resultsFile,
  `${JSON.stringify(output, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    {
      blindChiSquare: blind.chiSquare,
      descriptiveChiSquare:
        descriptive.chiSquare,
      shortestMarcusRatePerSecond:
        shortestMarcusRate,
      differenceOrdersOfMagnitude:
        output.shortestLinkerComparison
          .differenceOrdersOfMagnitude,
    },
    null,
    2,
  ),
);