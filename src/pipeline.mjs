import { digest, evidenceDigest } from "./canonical.mjs";
import { validateBundle, validReportShape } from "./contracts.mjs";

function evaluate(attempt, policy) {
  const { candidate, checks, reviews } = attempt;
  const reasons = [];
  if (
    !policy.requiredChecks.every((name) =>
      checks.some((check) => check.name === name),
    )
  )
    reasons.push("missing_evidence");
  if (
    checks.some(
      (check) =>
        check.headSha !== candidate.headSha ||
        check.contentDigest !== candidate.contentDigest,
    )
  )
    reasons.push("stale_evidence");
  if (checks.some((check) => check.status !== "passed"))
    reasons.push("failed_check");
  const currentEvidenceDigest = evidenceDigest(checks);
  if (
    !policy.requiredReviewers.every((name) =>
      reviews.some((review) => review.reviewer === name),
    )
  )
    reasons.push("missing_review");
  if (
    reviews.some(
      (review) =>
        review.headSha !== candidate.headSha ||
        review.contentDigest !== candidate.contentDigest ||
        review.evidenceDigest !== currentEvidenceDigest,
    )
  )
    reasons.push("stale_review");
  if (reviews.some((review) => review.verdict !== "approve"))
    reasons.push("changes_requested");
  return {
    headSha: candidate.headSha,
    contentDigest: candidate.contentDigest,
    evidenceDigest: currentEvidenceDigest,
    status: reasons.length ? "rejected" : "accepted",
    reasons,
  };
}

// Evaluation consumes supplied synthetic attempts; it never runs a builder, test command or model.
export function runPipeline(input) {
  const bundle = validateBundle(input);
  const attempts = [];
  let status = "awaiting-revision";
  let acceptedHeadSha = null;
  for (
    let i = 0;
    i < Math.min(bundle.attempts.length, bundle.policy.maxAttempts);
    i++
  ) {
    const result = evaluate(bundle.attempts[i], bundle.policy);
    attempts.push({ attempt: i + 1, ...result });
    if (result.status === "accepted") {
      status = "ready-for-human-review";
      acceptedHeadSha = result.headSha;
      break;
    }
  }
  if (acceptedHeadSha === null && attempts.length === bundle.policy.maxAttempts)
    status = "budget-exhausted";
  const report = {
    schemaVersion: "report-v1",
    source: "synthetic",
    bundleDigest: digest(bundle),
    policy: bundle.policy,
    status,
    acceptedHeadSha,
    evaluatedAttempts: attempts.length,
    ignoredAttempts: bundle.attempts.length - attempts.length,
    attempts,
    authority: {
      executeCode: false,
      modelCalls: false,
      push: false,
      merge: false,
      deploy: false,
    },
    limitations: [
      "Synthetic SHAs are labels, not verified Git objects.",
      "Digest binding checks consistency, not authenticity or proof that checks actually ran.",
      "Reviewer roles are fixture labels, not independent identities or real AI assessments.",
      "A ready result only prepares a human handoff; it authorizes no external action.",
    ],
  };
  return { ...report, reportDigest: digest(report) };
}
export function verifyReport(report, bundle) {
  return (
    validReportShape(report) && digest(report) === digest(runPipeline(bundle))
  );
}
