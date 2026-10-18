# Verification

The tests demonstrate the local evaluator's behavior. They do not certify the
private engine, real AI review quality, a sandbox, provider execution or publication.

Tests cover:

- All eight deterministic scenarios, input non-mutation and closed output shape.
- Candidate SHA/content and current evidence binding; old approvals cannot authorize
  changed revisions or evidence.
- Tampered source/logs, missing/duplicate artifacts, invalid paths and revision order.
- Retry ceiling, rejected outcomes, fresh second-attempt recovery and ignored attempts.
- Full report recomputation rather than trusting supplied status/hash fields.
- Raw synthetic source/log omission from summaries, controlled error text, size limits,
  invalid UTF-8, symlinks and malformed JSON.
- CLI export/verify/evaluate, all exit codes, idempotence and output conflicts.
- Real CLI subprocess with socket connects and global fetch blocked, using a minimal
  environment without provider credentials.
- Checked-in examples and fixtures regenerated from their executable definitions.

`npm run check` also runs format, lint and a limited current/history publication scan.
CI runs a clean locked installation, checks, dependency audit and an accepted export
followed by verification. Tests use the current supported Node runtime in CI.

Hash consistency does not prove execution or authenticity: a bundle author controls
its synthetic claims. The report's false authority fields and documentation keep
this boundary explicit. The publication scanner covers selected patterns, not every
secret format, and is not a full security audit.
