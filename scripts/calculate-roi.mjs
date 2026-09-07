import { calculateRoi } from "../lib/roi.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isFinite(value)) throw new Error(`--${name} requires a number.`);
  return value;
}

const pullRequests = option("prs", 300);
const minutesPerPr = option("minutes", 2);
const automationRate = option("automation", 0.8);
const hourlyCost = option("hourly-cost", 80);
const result = calculateRoi({ pullRequests, minutesPerPr, automationRate, hourlyCost });

console.log("Monthly pull_request_target metadata-automation ROI");
console.log(`- External PRs: ${pullRequests}`);
console.log(`- Manual triage time: ${minutesPerPr} minute(s) per PR`);
console.log(`- Automatically handled: ${(automationRate * 100).toFixed(0)}%`);
console.log(`- PRs automated: ${result.automatedPullRequests.toFixed(1)}`);
console.log(`- Maintainer time returned: ${result.hoursSaved.toFixed(1)} hour(s)`);
console.log(`- Illustrative value: $${result.estimatedValue.toFixed(2)}`);
console.log("\nThis estimates metadata toil only; it does not value faster contributor feedback.");
