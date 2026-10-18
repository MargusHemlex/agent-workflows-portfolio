import { readFileSync } from "node:fs";
import Ajv from "ajv";
import { candidateDigest, digest } from "./canonical.mjs";
const schema = JSON.parse(
  readFileSync(new URL("../schemas/bundle.schema.json", import.meta.url)),
);
const ajv = new Ajv({ allErrors: false, strict: true });
ajv.addSchema(schema);
const validate = ajv.getSchema(schema.$id);
const reportSchema = JSON.parse(
  readFileSync(new URL("../schemas/report.schema.json", import.meta.url)),
);
export const validReportShape = ajv.compile(reportSchema);

export class InputError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
function invalid(code) {
  throw new InputError(code);
}
export function validateBundle(input) {
  if (!validate(input)) invalid("invalid_bundle_contract");
  const bundle = structuredClone(input);
  const heads = new Set();
  const base = bundle.attempts[0].candidate.baseSha;
  for (const attempt of bundle.attempts) {
    const candidate = attempt.candidate;
    if (
      candidate.baseSha !== base ||
      candidate.baseSha === candidate.headSha ||
      heads.has(candidate.headSha)
    )
      invalid("invalid_revision_sequence");
    heads.add(candidate.headSha);
    const paths = candidate.files.map((file) => file.path);
    if (
      new Set(paths).size !== paths.length ||
      paths.some((path) =>
        path.split("/").some((part) => !part || part === "." || part === ".."),
      )
    )
      invalid("invalid_artifact_path");
    if (candidateDigest(candidate.files) !== candidate.contentDigest)
      invalid("candidate_digest_mismatch");
    if (
      new Set(attempt.checks.map((check) => check.name)).size !==
      attempt.checks.length
    )
      invalid("duplicate_check");
    if (
      new Set(attempt.reviews.map((review) => review.reviewer)).size !==
      attempt.reviews.length
    )
      invalid("duplicate_reviewer");
    for (const check of attempt.checks)
      if (digest(check.log) !== check.logDigest)
        invalid("evidence_digest_mismatch");
  }
  return bundle;
}
