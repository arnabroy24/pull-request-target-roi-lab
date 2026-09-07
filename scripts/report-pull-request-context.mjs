import fs from "node:fs";
import path from "node:path";

function visibleAscii(value, maximumLength = 200) {
  return value
    .trim()
    .slice(0, maximumLength)
    .replace(/[^\x20-\x7e]/g, "?");
}

function html(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("|", "&#124;");
}

const markerPath = path.join(process.cwd(), "demo", "source-marker.txt");
const eventPath = process.env.GITHUB_EVENT_PATH;
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!fs.existsSync(markerPath)) throw new Error("demo/source-marker.txt is missing.");
if (!eventPath || !fs.existsSync(eventPath)) throw new Error("GITHUB_EVENT_PATH is missing.");
if (!summaryPath) throw new Error("GITHUB_STEP_SUMMARY is missing.");

const marker = visibleAscii(fs.readFileSync(markerPath, "utf8"));
const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
if (!event.pull_request) throw new Error("This reporter requires a pull request event.");

const observations = {
  event: visibleAscii(process.env.GITHUB_EVENT_NAME ?? "unknown"),
  ref: visibleAscii(process.env.GITHUB_REF ?? "unknown"),
  sha: visibleAscii(process.env.GITHUB_SHA ?? "unknown"),
  marker,
  fork: event.pull_request.head?.repo?.fork === true,
};

console.log(`EVENT=${JSON.stringify(observations.event)}`);
console.log(`REF=${JSON.stringify(observations.ref)}`);
console.log(`SHA=${JSON.stringify(observations.sha)}`);
console.log(`SOURCE_MARKER=${JSON.stringify(observations.marker)}`);
console.log(`FORK=${observations.fork}`);
console.log("METADATA_WRITE_AVAILABLE=false");
console.log("REPOSITORY_SECRETS_AVAILABLE=false");

const summary = [
  "# `pull_request` live observation",
  "",
  "| Question | Observation |",
  "| --- | --- |",
  `| Event | <code>${html(observations.event)}</code> |`,
  `| Checked-out ref | <code>${html(observations.ref)}</code> |`,
  `| Checked-out source marker | <code>${html(observations.marker)}</code> |`,
  `| External fork | \`${observations.fork}\` |`,
  "| Contributor revision executed | **yes** |",
  "| Repository metadata write | **no**; this workflow requests read-only access |",
  "| Repository secrets | **none configured or passed** |",
  "",
  "This is the appropriate context for building or testing proposed code.",
  "It is intentionally the wrong context for privileged maintainer automation.",
  "",
].join("\n");

fs.appendFileSync(summaryPath, summary, "utf8");
