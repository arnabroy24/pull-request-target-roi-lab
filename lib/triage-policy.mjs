function assertStringArray(value, field) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new TypeError(`${field} must be an array of strings.`);
  }
}

export function validatePolicy(policy) {
  if (!policy || typeof policy !== "object") {
    throw new TypeError("The triage policy must be an object.");
  }
  if (!policy.labels || typeof policy.labels !== "object") {
    throw new TypeError("The triage policy must define labels.");
  }
  if (!Array.isArray(policy.rules)) {
    throw new TypeError("The triage policy must define rules.");
  }
  if (!policy.labels[policy.fallbackLabel]) {
    throw new Error(`Fallback label is not defined: ${policy.fallbackLabel}`);
  }
  if (!Number.isInteger(policy.largeChangeThreshold) || policy.largeChangeThreshold < 1) {
    throw new TypeError("largeChangeThreshold must be a positive integer.");
  }

  for (const rule of policy.rules) {
    if (!policy.labels[rule.label]) {
      throw new Error(`Rule refers to an undefined label: ${rule.label}`);
    }
    assertStringArray(rule.prefixes ?? [], `${rule.label}.prefixes`);
    assertStringArray(rule.suffixes ?? [], `${rule.label}.suffixes`);
  }

  return policy;
}

function ruleMatches(filename, rule) {
  const prefixes = rule.prefixes ?? [];
  const suffixes = rule.suffixes ?? [];
  return prefixes.some((prefix) => filename.startsWith(prefix)) ||
    suffixes.some((suffix) => filename.endsWith(suffix));
}

export function classifyFiles(files, unvalidatedPolicy) {
  assertStringArray(files, "files");
  const policy = validatePolicy(unvalidatedPolicy);
  const labels = new Set();

  for (const rule of policy.rules) {
    if (files.some((filename) => ruleMatches(filename, rule))) {
      labels.add(rule.label);
    }
  }

  if (labels.size === 0) labels.add(policy.fallbackLabel);
  if (files.length >= policy.largeChangeThreshold) labels.add("size: large");
  return [...labels];
}

export function buildComment({ author, files, labels, sourceMarker, isFork }) {
  if (typeof author !== "string" || !/^[A-Za-z0-9-]+(?:\[bot\])?$/.test(author)) {
    throw new TypeError("author must be a GitHub login.");
  }
  assertStringArray(files, "files");
  assertStringArray(labels, "labels");
  if (typeof sourceMarker !== "string" || !/^[A-Z0-9_]+$/.test(sourceMarker)) {
    throw new TypeError("sourceMarker must be a trusted marker value.");
  }
  if (typeof isFork !== "boolean") {
    throw new TypeError("isFork must be a boolean.");
  }

  return [
    "<!-- pull-request-target-roi-lab -->",
    `Thanks @${author}! This PR triggered both workflow trust models.`,
    "",
    "## What this PR demonstrates",
    "",
    "| | `pull_request` | `pull_request_target` |",
    "| --- | --- | --- |",
    "| Code source | Proposed PR merge revision | Trusted base default branch |",
    "| Contributor code executed | **yes** | **no** |",
    "| Granted authority in this lab | `contents: read` | `contents: read`, `pull-requests: read`, `issues: write` |",
    "| Best use | Build, lint, and test the proposal | Label, comment, and manage PR metadata |",
    "| Visible result | `01` check and job summary | This comment and the applied labels |",
    "",
    `This PR came from ${isFork ? "an external fork" : "a branch in the base repository"}.`,
    `The trusted workflow checked out source marker \`${sourceMarker}\`.`,
    "",
    `- Files inspected through the GitHub API: ${files.length}`,
    `- Labels selected from base-branch policy: ${labels.map((label) => `\`${label}\``).join(", ")}`,
    "",
    "Open the **01 - pull_request** check to see the proposed revision that the restricted workflow executed. This comment is proof that the separate **02 - pull_request_target** workflow could write PR metadata without executing that revision.",
  ].join("\n");
}
