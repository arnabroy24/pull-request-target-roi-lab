export function calculateRoi({ pullRequests, minutesPerPr, automationRate, hourlyCost = 0 }) {
  for (const [name, value] of Object.entries({
    pullRequests,
    minutesPerPr,
    automationRate,
    hourlyCost,
  })) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new TypeError(`${name} must be a non-negative number.`);
    }
  }
  if (automationRate > 1) throw new RangeError("automationRate must be between 0 and 1.");

  const automatedPullRequests = pullRequests * automationRate;
  const hoursSaved = (automatedPullRequests * minutesPerPr) / 60;
  return {
    automatedPullRequests,
    hoursSaved,
    estimatedValue: hoursSaved * hourlyCost,
  };
}
