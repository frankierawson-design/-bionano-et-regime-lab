import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const repositoryRoot = new URL("../", import.meta.url);

const scriptPath = new URL(
  "../scripts/jain-2024-gnp100-monte-carlo.mjs",
  import.meta.url,
);

const summaryPath = new URL(
  "../results/jain-2024-gnp100-monte-carlo-summary.json",
  import.meta.url,
);

const drawsPath = new URL(
  "../results/jain-2024-gnp100-monte-carlo-draws.csv.gz",
  import.meta.url,
);

function runAnalysis() {
  execFileSync(
    process.execPath,
    [fileURLToPath(scriptPath)],
    {
      cwd: fileURLToPath(repositoryRoot),
      stdio: "pipe",
    },
  );
}

function approximatelyEqual(
  actual,
  expected,
  tolerance = 1e-12,
) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test(
  "fixed-seed GNP100 Monte Carlo analysis is reproducible",
  async () => {
    runAnalysis();

    const firstSummaryFile =
      await readFile(summaryPath);

    const firstDrawsFile =
      await readFile(drawsPath);

    // Run the calculation again to confirm byte-for-byte
    // reproducibility with the documented fixed seed.
    runAnalysis();

    const secondSummaryFile =
      await readFile(summaryPath);

    const secondDrawsFile =
      await readFile(drawsPath);

    assert.deepEqual(
      secondSummaryFile,
      firstSummaryFile,
    );

    assert.deepEqual(
      secondDrawsFile,
      firstDrawsFile,
    );

    const summary = JSON.parse(
      secondSummaryFile.toString("utf8"),
    );

    assert.equal(summary.softwareVersion, "0.2.1");
    assert.equal(summary.seed, 20260905);
    assert.equal(summary.drawsPerScenario, 100_000);

    const rateOnly =
      summary.scenarios.rateOnly;

    approximatelyEqual(
      rateOnly.medianAlphaNmInverse,
      0.21250266872084372,
    );

    approximatelyEqual(
      rateOnly.lower95AlphaNmInverse,
      0.1324601713922496,
    );

    approximatelyEqual(
      rateOnly.upper95AlphaNmInverse,
      0.34061157236785355,
    );

    approximatelyEqual(
      rateOnly.probabilityAlphaGreaterThanZero,
      0.99999,
    );

    const lengthAndRate =
      summary.scenarios.lengthAndRate;

    approximatelyEqual(
      lengthAndRate.medianAlphaNmInverse,
      0.17213673123335338,
    );

    approximatelyEqual(
      lengthAndRate.lower95AlphaNmInverse,
      0.02099212833508796,
    );

    approximatelyEqual(
      lengthAndRate.upper95AlphaNmInverse,
      0.40002337317870046,
    );

    approximatelyEqual(
      lengthAndRate.probabilityAlphaGreaterThanZero,
      0.98343,
    );

    const csv = gunzipSync(
      secondDrawsFile,
    ).toString("utf8");

    const rows = csv.trim().split("\n");

    assert.equal(
      rows[0],
      "draw,alpha_rate_only_nm_inverse,alpha_length_and_rate_nm_inverse",
    );

    assert.equal(rows.length, 100_001);
  },
);