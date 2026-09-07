import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildComment, classifyFiles } from "../lib/triage-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(
  fs.readFileSync(path.join(root, "fixtures", "external-pr.json"), "utf8"),
);
const policy = JSON.parse(
  fs.readFileSync(path.join(root, ".github", "triage-policy.json"), "utf8"),
);
const baseSourceMarker = fs
  .readFileSync(path.join(root, "demo", "source-marker.txt"), "utf8")
  .trim();

const files = fixture.changedFiles;
const labels = classifyFiles(files, policy);
const comment = buildComment({
  author: fixture.pull_request.user.login,
  files,
  labels,
  sourceMarker: baseSourceMarker,
  isFork: fixture.pull_request.head.repo.fork,
});

console.log("Side-by-side event preview\n");
console.log(`pull_request source marker:        ${fixture.forkSourceMarker}`);
console.log(`pull_request_target source marker: ${baseSourceMarker}\n`);
console.log(`Changed files: ${files.join(", ")}`);
console.log(`Labels: ${labels.join(", ")}\n`);
console.log(comment);
console.log("\nNo network request or contributor code execution occurred.");
