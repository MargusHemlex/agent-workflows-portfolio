import { candidateDigest, digest, evidenceDigest } from "./canonical.mjs";
export const SCENARIOS = [
  "passing",
  "stale-review",
  "missing-evidence",
  "changes-requested",
  "failed-check",
  "exhausted-budget",
  "stale-evidence",
  "recovered",
];
function attempt(number) {
  const candidate = {
    baseSha: "a".repeat(40),
    headSha: String(number).repeat(40),
    files: [
      {
        path: "src/example.mjs",
        content: `// Synthetic candidate ${number}; never executed.\nexport const value = ${number};\n`,
      },
    ],
  };
  candidate.contentDigest = candidateDigest(candidate.files);
  const checks = ["lint", "tests"].map((name) => {
    const log = `synthetic ${name}: passed`;
    return {
      name,
      headSha: candidate.headSha,
      contentDigest: candidate.contentDigest,
      status: "passed",
      log,
      logDigest: digest(log),
    };
  });
  const reviews = ["quality", "security"].map((reviewer) => ({
    reviewer,
    headSha: candidate.headSha,
    contentDigest: candidate.contentDigest,
    evidenceDigest: evidenceDigest(checks),
    verdict: "approve",
  }));
  return { candidate, checks, reviews };
}
function rebindReviews(item) {
  for (const review of item.reviews)
    review.evidenceDigest = evidenceDigest(item.checks);
}
export function fixture(scenario) {
  if (!SCENARIOS.includes(scenario)) throw new Error("unknown_scenario");
  const first = attempt(1);
  if (scenario === "stale-review") first.reviews[0].headSha = "0".repeat(40);
  if (scenario === "missing-evidence") {
    first.checks.pop();
    rebindReviews(first);
  }
  if (
    scenario === "changes-requested" ||
    scenario === "exhausted-budget" ||
    scenario === "recovered"
  )
    first.reviews[0].verdict = "changes-requested";
  if (scenario === "failed-check") {
    first.checks[1].status = "failed";
    first.checks[1].log = "synthetic tests: failed";
    first.checks[1].logDigest = digest(first.checks[1].log);
    rebindReviews(first);
  }
  if (scenario === "stale-evidence") {
    first.checks[0].headSha = "0".repeat(40);
    rebindReviews(first);
  }
  const attempts = [first];
  if (scenario === "exhausted-budget") {
    const second = attempt(2);
    second.reviews[0].verdict = "changes-requested";
    attempts.push(second);
  }
  if (scenario === "recovered") attempts.push(attempt(2));
  return {
    schemaVersion: "bundle-v1",
    source: "synthetic",
    policy: {
      maxAttempts: 2,
      requiredChecks: ["lint", "tests"],
      requiredReviewers: ["quality", "security"],
    },
    attempts,
  };
}
