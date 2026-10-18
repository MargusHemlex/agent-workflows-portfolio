export function renderReport(report) {
  return [
    "# Agent Workflows Review Pipeline",
    "",
    "**Synthetic evidence only. No external action is authorized.**",
    "",
    `Status: **${report.status}**`,
    `Accepted synthetic SHA: ${report.acceptedHeadSha ?? "none"}`,
    `Evaluated attempts: ${report.evaluatedAttempts} / ${report.policy.maxAttempts}`,
    "",
    "| Attempt | Synthetic SHA | Outcome | Reasons |",
    "|---|---|---|---|",
    ...report.attempts.map(
      (item) =>
        `| ${item.attempt} | ${item.headSha} | ${item.status} | ${item.reasons.join(", ") || "none"} |`,
    ),
    "",
    `Bundle digest: \`${report.bundleDigest}\``,
    `Report digest: \`${report.reportDigest}\``,
    "",
    "## Limits",
    "",
    ...report.limitations.map((item) => `- ${item}`),
    "",
  ].join("\n");
}
