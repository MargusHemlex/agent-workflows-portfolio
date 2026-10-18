# Contributing

Use Node.js 22.13+ (22.x), or 24+, and `npm ci`. Source comments and documentation
should be English. Run `npm run check` and `npm audit` before proposing a change.
Use `npm run examples` to regenerate fixtures, followed by `npm run format`.

Keep examples authored, synthetic and nonpersonal. Do not add original engine
source, project contracts, prompts, credentials, raw production logs, private packages
or publisher integrations. New scenarios should demonstrate a meaningful invariant
or failure mode rather than mirror implementation details.

Explain the observable change, its boundary and verification. Do not claim real
model reviews or command execution from fixture verdicts. Publication remains an
owner decision after final review.
