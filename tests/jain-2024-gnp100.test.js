import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { analysisProvenance } from "../scripts/analysis-provenance.mjs";

function close(actual, expected, relativeTolerance = 1e-9) {
  const scale = Math.max(
    1,
    Math.abs(actual),
    Math.abs(expected),
  );

  assert.ok(
    Math.abs(actual - expected) <=
      relativeTolerance * scale,
    `${actual} does not match ${expected}`,
  );
}

test(
  "Jain 2024 GNP100 comparison reproduces expected results",
  () => {
    const stdout = execFileSync(
      process.execPath,
      ["scripts/jain-2024-gnp100.mjs"],
      {
        encoding: "utf8",
      },
    );

    const result = JSON.parse(stdout);
    const saved = JSON.parse(readFileSync(new URL('../results/jain-2024-gnp100-results.json', import.meta.url), 'utf8'));
    const provenance = analysisProvenance();
    for (const key of ['softwareVersion', 'codeCommit', 'sourceTreeDirty', 'sourcePaths']) {
      assert.deepEqual(saved[key], provenance[key]);
    }

    close(
      result.blindChiSquare,
      121.70016062175795,
    );

    close(
      result.descriptiveChiSquare,
      3.4718480291332963,
    );

    close(
      result.shortestMarcusRatePerSecond,
      55528236442467.57,
    );

    close(
      result.differenceOrdersOfMagnitude,
      18.45635411732558,
    );
  },
);
