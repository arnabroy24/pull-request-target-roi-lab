import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildComment, classifyFiles } from "../lib/triage-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = JSON.parse(
  fs.readFileSync(path.join(root, ".github", "triage-policy.json"), "utf8"),
);

test("classifies metadata without opening contributor files", () => {
  assert.deepEqual(
    classifyFiles(["docs/guide.md", "src/index.js", "tests/index.test.js"], policy),
    ["area: documentation", "area: source", "area: tests"],
  );
});

test("uses the fallback label", () => {
  assert.deepEqual(classifyFiles(["package.json"], policy), ["area: general"]);
});

test("adds the large-change label", () => {
  const files = Array.from({ length: 25 }, (_, index) => `src/file-${index}.js`);
  assert.deepEqual(classifyFiles(files, policy), ["area: source", "size: large"]);
});

test("comment records the trust boundary", () => {
  const comment = buildComment({
    author: "octocat",
    files: ["README.md"],
    labels: ["area: documentation"],
    sourceMarker: "BASE_DEFAULT_BRANCH_VERSION",
    isFork: true,
  });
  assert.match(comment, /This PR triggered both workflow trust models/);
  assert.match(comment, /\| Contributor code executed \| \*\*yes\*\* \| \*\*no\*\* \|/);
  assert.match(comment, /This comment is proof/);
  assert.match(comment, /external fork/);
  assert.match(comment, /@octocat/);
  assert.match(comment, /BASE_DEFAULT_BRANCH_VERSION/);
});

test("comment supports pull requests from base-repository branches", () => {
  const comment = buildComment({
    author: "dependabot[bot]",
    files: ["package.json"],
    labels: ["area: general"],
    sourceMarker: "BASE_DEFAULT_BRANCH_VERSION",
    isFork: false,
  });

  assert.match(comment, /@dependabot\[bot\]/);
  assert.match(comment, /branch in the base repository/);
});
