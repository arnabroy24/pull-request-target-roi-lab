import assert from "node:assert/strict";
import test from "node:test";
import { calculateRoi } from "../lib/roi.mjs";

test("calculates monthly maintainer time returned", () => {
  assert.deepEqual(
    calculateRoi({
      pullRequests: 300,
      minutesPerPr: 2,
      automationRate: 0.8,
      hourlyCost: 80,
    }),
    {
      automatedPullRequests: 240,
      hoursSaved: 8,
      estimatedValue: 640,
    },
  );
});

test("rejects an impossible automation rate", () => {
  assert.throws(
    () => calculateRoi({ pullRequests: 1, minutesPerPr: 1, automationRate: 1.1 }),
    /between 0 and 1/,
  );
});
