import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetWorkflow = fs.readFileSync(
  path.join(root, ".github", "workflows", "pull-request-metadata.yml"),
  "utf8",
);
const pullRequestWorkflow = fs.readFileSync(
  path.join(root, ".github", "workflows", "pull-request-context.yml"),
  "utf8",
);

test("enabled workflow preserves the metadata-only trust boundary", () => {
  for (const required of [
    "pull_request_target:",
    "types: [opened, synchronize, reopened]",
    "contents: read",
    "issues: write",
    "pull-requests: write",
    "actions/checkout@11d5960a326750d5838078e36cf38b85af677262",
    "persist-credentials: false",
    "GH_TOKEN: ${{ github.token }}",
    "run: node .github/scripts/triage.mjs",
  ]) {
    assert.ok(targetWorkflow.includes(required), `target workflow is missing: ${required}`);
  }

  for (const forbidden of [
    "github.event.pull_request.head.repo.fork == true",
    "pull_request.head.sha",
    "pull_request.head.repo.full_name",
    "allow-unsafe-pr-checkout",
    "${{ secrets.",
    "actions/cache",
    "actions/download-artifact",
  ]) {
    assert.ok(
      !targetWorkflow.includes(forbidden),
      `target workflow must not contain: ${forbidden}`,
    );
  }
});

test("pull_request comparison can execute the contribution but cannot write", () => {
  for (const required of [
    "pull_request:",
    "types: [opened, synchronize, reopened]",
    "permissions:\n  contents: read",
    "actions/checkout@11d5960a326750d5838078e36cf38b85af677262",
    "persist-credentials: false",
    "run: node scripts/report-pull-request-context.mjs",
  ]) {
    assert.ok(
      pullRequestWorkflow.includes(required),
      `pull_request workflow is missing: ${required}`,
    );
  }

  for (const forbidden of [
    "github.event.pull_request.head.repo.fork == true",
    "issues: write",
    "pull-requests: write",
    "GH_TOKEN:",
    "${{ secrets.",
    "allow-unsafe-pr-checkout",
  ]) {
    assert.ok(
      !pullRequestWorkflow.includes(forbidden),
      `pull_request workflow must not contain: ${forbidden}`,
    );
  }
});
