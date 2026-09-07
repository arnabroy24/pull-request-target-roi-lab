import fs from "node:fs";
import path from "node:path";
import { buildComment, classifyFiles, validatePolicy } from "../../lib/triage-policy.mjs";

const eventPath = process.env.GITHUB_EVENT_PATH;
const token = process.env.GH_TOKEN;

if (!eventPath || !fs.existsSync(eventPath)) {
  throw new Error("GITHUB_EVENT_PATH is missing or unreadable.");
}
if (!token) throw new Error("GH_TOKEN is required.");

const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
const pullRequest = event.pull_request;
if (!pullRequest) throw new Error("This lab requires a pull request event.");

const repository = event.repository?.full_name;
const pullNumber = pullRequest.number;
const author = pullRequest.user?.login;
const isFork = pullRequest.head?.repo?.fork === true;
if (typeof repository !== "string" || !/^[^/]+\/[^/]+$/.test(repository)) {
  throw new Error("The event does not contain a valid repository name.");
}
if (!Number.isInteger(pullNumber) || pullNumber < 1) {
  throw new Error("The event does not contain a valid pull request number.");
}

const policyPath = path.join(process.cwd(), ".github", "triage-policy.json");
const policy = validatePolicy(JSON.parse(fs.readFileSync(policyPath, "utf8")));
const sourceMarker = fs
  .readFileSync(path.join(process.cwd(), "demo", "source-marker.txt"), "utf8")
  .trim();
const apiBase = process.env.GITHUB_API_URL ?? "https://api.github.com";

async function api(route, { method = "GET", body, allowNotFound = false } = {}) {
  const response = await fetch(`${apiBase}/${route}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "pull-request-target-roi-lab",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (allowNotFound && response.status === 404) return null;
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${method} ${route} failed with ${response.status}: ${detail}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function listChangedFiles() {
  const filenames = [];
  for (let page = 1; page <= 30; page += 1) {
    const records = await api(
      `repos/${repository}/pulls/${pullNumber}/files?per_page=100&page=${page}`,
    );
    for (const record of records) filenames.push(record.filename);
    if (records.length < 100) return filenames;
  }
  throw new Error("The pull request exceeds the lab's 3,000-file inspection limit.");
}

async function ensureLabel(name) {
  const encodedName = encodeURIComponent(name);
  const existing = await api(`repos/${repository}/labels/${encodedName}`, {
    allowNotFound: true,
  });
  if (existing) return;

  const definition = policy.labels[name];
  await api(`repos/${repository}/labels`, {
    method: "POST",
    body: { name, color: definition.color, description: definition.description },
  });
}

const files = await listChangedFiles();
const labels = classifyFiles(files, policy);
for (const label of labels) await ensureLabel(label);

await api(`repos/${repository}/issues/${pullNumber}/labels`, {
  method: "POST",
  body: { labels },
});

await api(`repos/${repository}/issues/${pullNumber}/comments`, {
  method: "POST",
  body: { body: buildComment({ author, files, labels, sourceMarker, isFork }) },
});

console.log(`Triaged PR #${pullNumber}: ${labels.join(", ")}`);
console.log(`SOURCE_MARKER=${JSON.stringify(sourceMarker)}`);
console.log("Only trusted default-branch code and GitHub API metadata were used.");
