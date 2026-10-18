# Contracts and CLI

`schemas/bundle.schema.json` and `schemas/report.schema.json` are closed JSON schemas.
The report schema references the bundle schema's example policy definition; load both
schemas when validating externally. The runtime registers both with Ajv.

## Bundle

A `bundle-v1` input has `source: synthetic`, an example policy and one to three
attempts. The policy allows one to three evaluated attempts and fixes the two check
and reviewer names. Each attempt contains:

- Candidate: base/head SHA labels, at most eight embedded files, content digest.
- Checks: names, SHA/content binding, explicit result, log string and log digest.
- Reviews: reviewer label, SHA/content/evidence binding and approve/changes-requested.

SHA labels use 40 lowercase hex characters. Digests use `sha256:` and 64 hex
characters. They do not contact Git or prove that a SHA exists. Paths are at most
100 ASCII characters; empty/dot/parent segments and duplicates are rejected. File
contents and logs are at most 4,096 characters; the complete JSON file is at most
256 KiB. Logs are digested as canonical JSON strings, not raw byte streams.

Malformed contracts, duplicate identifiers, invalid revision sequences or tampered
content/log digests fail before a report is produced. Valid but stale/missing/failed
checks or reviews produce an explicitly non-ready report. All supplied attempts are
validated even if the budget or earlier acceptance prevents their evaluation.

## Report

A `report-v1` summary records input digest, policy, final outcome, evaluated/ignored
attempt counts, reasons, accepted SHA (or null), limitations and false authority fields.
Its `reportDigest` hashes the report body before that field is added. Verification
validates shape and compares the entire report to a recomputed result from its bundle.
A self-consistent report hash alone is insufficient.

Reason codes: `missing_evidence`, `stale_evidence`, `failed_check`, `missing_review`,
`stale_review`, `changes_requested`. Ready does not mean merged, published or deployed.

## Commands

```sh
node src/cli.mjs --help
node src/cli.mjs list
node src/cli.mjs run --scenario passing --output pipeline-output/passing
node src/cli.mjs evaluate --bundle fixtures/stale-review/bundle.json --output pipeline-output/stale
node src/cli.mjs verify --bundle pipeline-output/passing/bundle.json --report pipeline-output/passing/report.json
```

The stale example exits 3 intentionally. Other exit codes: 0 ready/verified, 2 invalid
input or invocation, 4 conflicting output. Duplicate/unknown flags are rejected.
The CLI never treats a bundle path, file content or check log as a command.
