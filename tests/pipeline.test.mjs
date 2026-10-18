import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { digest, candidateDigest, evidenceDigest } from "../src/canonical.mjs";
import { fixture, SCENARIOS } from "../src/fixtures.mjs";
import { runPipeline, verifyReport } from "../src/pipeline.mjs";
import { InputError, validReportShape } from "../src/contracts.mjs";
import { renderReport } from "../src/reporting.mjs";
const expected = {
  passing: ["ready-for-human-review", []],
  "stale-review": ["awaiting-revision", ["stale_review"]],
  "missing-evidence": ["awaiting-revision", ["missing_evidence"]],
  "changes-requested": ["awaiting-revision", ["changes_requested"]],
  "failed-check": ["awaiting-revision", ["failed_check"]],
  "exhausted-budget": ["budget-exhausted", ["changes_requested"]],
  "stale-evidence": ["awaiting-revision", ["stale_evidence"]],
  recovered: ["ready-for-human-review", ["changes_requested"]],
};
for (const scenario of SCENARIOS)
  test(`scenario ${scenario} is deterministic and matches its documented outcome`, () => {
    const bundle = fixture(scenario),
      before = structuredClone(bundle);
    const report = runPipeline(bundle);
    assert.equal(report.status, expected[scenario][0]);
    assert.deepEqual(report.attempts[0].reasons, expected[scenario][1]);
    assert.equal(validReportShape(report), true);
    assert.deepEqual(runPipeline(bundle), report);
    assert.deepEqual(bundle, before);
    assert.equal(verifyReport(report, bundle), true);
    assert.ok(
      Object.values(report.authority).every((value) => value === false),
    );
  });
test("a new SHA cannot reuse old approval even when candidate content is unchanged", () => {
  const bundle = fixture("passing");
  bundle.attempts[0].candidate.headSha = "f".repeat(40);
  for (const check of bundle.attempts[0].checks) check.headSha = "f".repeat(40);
  const result = runPipeline(bundle);
  assert.deepEqual(result.attempts[0].reasons, ["stale_review"]);
});
test("changing evidence invalidates old approvals even with the same SHA", () => {
  const bundle = fixture("passing");
  const check = bundle.attempts[0].checks[0];
  check.log = "changed synthetic check output";
  check.logDigest = digest(check.log);
  assert.deepEqual(runPipeline(bundle).attempts[0].reasons, ["stale_review"]);
});
test("content and log tampering fail closed rather than producing a ready report", () => {
  const a = fixture("passing");
  a.attempts[0].candidate.files[0].content += "changed";
  assert.throws(
    () => runPipeline(a),
    (error) =>
      error instanceof InputError && error.code === "candidate_digest_mismatch",
  );
  const b = fixture("passing");
  b.attempts[0].checks[0].log += "changed";
  assert.throws(() => runPipeline(b), /evidence_digest_mismatch/);
});
test("missing reviewers, changed content bindings and missing evidence never pass", () => {
  const a = fixture("passing");
  a.attempts[0].reviews.pop();
  assert.deepEqual(runPipeline(a).attempts[0].reasons, ["missing_review"]);
  const b = fixture("passing");
  b.attempts[0].reviews[0].contentDigest = `sha256:${"0".repeat(64)}`;
  assert.ok(runPipeline(b).attempts[0].reasons.includes("stale_review"));
  const c = fixture("passing");
  c.attempts[0].checks = [];
  assert.ok(runPipeline(c).attempts[0].reasons.includes("missing_evidence"));
});
test("strict contracts reject unknown fields, duplicate evidence, invalid paths and revisions", () => {
  const variants = [];
  let b = fixture("passing");
  b.extra = true;
  variants.push(b);
  b = fixture("passing");
  b.source = "production";
  variants.push(b);
  b = fixture("passing");
  b.attempts[0].candidate.files[0].path = "../secret";
  b.attempts[0].candidate.contentDigest = candidateDigest(
    b.attempts[0].candidate.files,
  );
  variants.push(b);
  b = fixture("passing");
  b.attempts[0].candidate.headSha = b.attempts[0].candidate.baseSha;
  variants.push(b);
  b = fixture("passing");
  b.attempts[0].checks[1] = b.attempts[0].checks[0];
  variants.push(b);
  b = fixture("passing");
  b.attempts[0].reviews[1] = b.attempts[0].reviews[0];
  variants.push(b);
  b = fixture("recovered");
  b.attempts[1].candidate.headSha = b.attempts[0].candidate.headSha;
  variants.push(b);
  b = fixture("recovered");
  b.attempts[1].candidate.baseSha = "b".repeat(40);
  variants.push(b);
  for (const item of variants)
    assert.throws(() => runPipeline(item), InputError);
});
test("attempt ceiling prevents a third ready candidate being accepted", () => {
  const bundle = fixture("exhausted-budget");
  const third = fixture("passing").attempts[0];
  third.candidate.headSha = "3".repeat(40);
  bundle.attempts.push(third);
  const report = runPipeline(bundle);
  assert.equal(report.status, "budget-exhausted");
  assert.equal(report.evaluatedAttempts, 2);
  assert.equal(report.ignoredAttempts, 1);
});
test("report body edits cannot reuse a valid report or bundle digest", () => {
  const bundle = fixture("stale-review");
  const report = runPipeline(bundle);
  report.status = "ready-for-human-review";
  report.acceptedHeadSha = "1".repeat(40);
  assert.equal(verifyReport(report, bundle), false);
  assert.equal(verifyReport(null, bundle), false);
});
test("ordering of object keys and set-like artifacts does not change relevant digests", () => {
  assert.equal(digest({ a: 1, b: 2 }), digest({ b: 2, a: 1 }));
  const checks = fixture("passing").attempts[0].checks;
  assert.equal(evidenceDigest(checks), evidenceDigest([...checks].reverse()));
});
test("summary reports omit embedded candidate source and raw check logs", () => {
  const b = fixture("passing");
  b.attempts[0].candidate.files[0].content = "SYNTHETIC_SOURCE_SENTINEL";
  const c = b.attempts[0].candidate;
  c.contentDigest = candidateDigest(c.files);
  for (const check of b.attempts[0].checks) {
    check.contentDigest = c.contentDigest;
    check.log = "SYNTHETIC_LOG_SENTINEL";
    check.logDigest = digest(check.log);
  }
  for (const review of b.attempts[0].reviews) {
    review.contentDigest = c.contentDigest;
    review.evidenceDigest = evidenceDigest(b.attempts[0].checks);
  }
  const report = runPipeline(b);
  for (const text of [JSON.stringify(report), renderReport(report)]) {
    assert.ok(!text.includes("SYNTHETIC_SOURCE_SENTINEL"));
    assert.ok(!text.includes("SYNTHETIC_LOG_SENTINEL"));
  }
});
test("checked-in examples and fixtures are fresh", () => {
  for (const scenario of SCENARIOS)
    assert.deepEqual(
      JSON.parse(
        readFileSync(
          new URL(`../fixtures/${scenario}/bundle.json`, import.meta.url),
        ),
      ),
      fixture(scenario),
    );
  const report = runPipeline(fixture("recovered"));
  assert.deepEqual(
    JSON.parse(
      readFileSync(new URL("../examples/report.json", import.meta.url)),
    ),
    report,
  );
  assert.equal(
    readFileSync(new URL("../examples/report.md", import.meta.url), "utf8"),
    renderReport(report),
  );
});
