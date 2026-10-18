# Agent Workflows Review Pipeline

A small, offline portfolio implementation of **evidence-bound code review**.
It shows how a candidate, its check evidence and its review verdicts can be bound
to the same revision, and how missing or stale confirmation stops a handoff.

This is a standalone implementation with authored synthetic fixtures. It does not
ship the private workflow engine, execute candidate code, call a model, run a real
review, or push/merge/deploy anything. No API keys or project credentials are required.
The owner approved public release on **18 October 2026**, after the final review.
The original engine remains private and unchanged.

## Why this exists

Agent-driven development needs more than a convincing approval message. A review
for an earlier revision, a changed check artifact or an exhausted fix budget must
not quietly become approval for a different candidate.

This repository makes those invariants readable and locally reproducible. It
independently implements a narrow evidence/review example inspired by the general
architecture of the private Agent Workflows project. It is not a source mirror,
consumer integration or replacement for that engine. No proprietary prompt, rubric,
or production publication policy is included.

## Run in two minutes

Requires Node.js **22.13+ (22.x), or 24+**, and npm.

```sh
git clone https://github.com/MargusHemlex/agent-workflows-portfolio.git
cd agent-workflows-portfolio
npm ci
node src/cli.mjs list
node src/cli.mjs run --scenario recovered --output pipeline-output/recovered
node src/cli.mjs verify --bundle pipeline-output/recovered/bundle.json --report pipeline-output/recovered/report.json
```

Inspect `pipeline-output/recovered/report.md` or the checked-in
[example report](examples/report.md). A run exports its synthetic audit bundle,
JSON/Markdown summary and both JSON schemas. Identical reruns are idempotent;
different output in an existing file is rejected. Use a fresh directory per scenario.
Initial package installation needs the network; runtime does not.

## What the pipeline checks

1. A closed JSON contract and the candidate's content digest.
2. Required check names, log digests, candidate SHA and content binding.
3. Required reviewer roles, their SHA/content binding and the complete evidence digest.
4. Explicit approvals and a fixed maximum number of supplied attempts.
5. A deterministic report that can be verified by recomputing the bundle outcome.

The outcome is `ready-for-human-review`, `awaiting-revision` or `budget-exhausted`.
Even a ready outcome has **no execution or publication authority**.

| Scenario          | Expected outcome                                                 |
| ----------------- | ---------------------------------------------------------------- |
| passing           | Ready after one attempt                                          |
| stale-review      | Stop: old approval cannot authorize a new candidate              |
| missing-evidence  | Stop: required check missing                                     |
| changes-requested | Stop: reviewer requested changes                                 |
| failed-check      | Stop: check failed                                               |
| stale-evidence    | Stop: check belongs to another candidate                         |
| exhausted-budget  | Stop after two rejected attempts                                 |
| recovered         | First rejected; fresh second candidate accepted for human review |

Exit codes: `0` ready or successfully verified, `3` valid but not ready, `2` invalid
input/arguments, `4` output conflict. `list` and `--help` also return 0.

## Verify the implementation

```sh
npm run check
npm audit
```

Tests cover exact-revision/content/evidence binding, tampering, missing/duplicate
records, invalid paths, bounded attempts, report edits, example freshness, CLI exit
codes, output conflicts, malformed inputs and network-blocked runtime. The fixtures
are **simulated checks and reviewer verdicts**; they do not prove that candidate
tests or independent AI reviews actually ran.

## Engineering guide

- [Architecture and decision flow](docs/ARCHITECTURE.md)
- [Contracts and CLI](docs/CONTRACTS.md)
- [Public/private boundary and data handling](docs/PUBLIC-PRIVATE.md)
- [Verification and limits](docs/VERIFICATION.md)
- [Release checklist](docs/RELEASE.md)
- [Synthetic examples](examples/README.md)
- [Contributing](CONTRIBUTING.md)

## Important limits

Synthetic 40-character SHAs are labels, not verified Git objects. Hash consistency
is not authenticity, identity verification, a signature, or proof of check execution.
The example policy travels with the input; it is not a protected production policy.
A caller can author a consistent synthetic bundle. `verify` proves recomputation,
not that an actor is trustworthy or an action is safe.

The audit `bundle.json` contains supplied synthetic source strings and evidence
logs. Summary reports omit those raw fields, but digests and SHA labels remain.
Do not supply real source, credentials, personal data or confidential artifacts.
Nothing is executed from bundle file paths, and there is no shell-command field.

Application code and authored fixtures are MIT licensed. Installed dependencies
retain their own licenses. Original project source, prompts, settings, Git history
and compiled bundles have not been copied into this repository.
