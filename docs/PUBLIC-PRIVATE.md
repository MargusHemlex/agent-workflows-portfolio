# Public/private boundary and data handling

The owner approved public release of the portfolio on **18 October 2026**, after
final review. The original repository remains **private** and its source,
configuration and deployment are unchanged.

| Intended public portfolio                              | Private original                                               |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| Independently authored minimal evidence/review example | Full workflow engine and orchestration                         |
| Closed illustrative JSON contracts                     | Project execution contracts and internal policy                |
| Synthetic candidates, check logs and verdicts          | Real project source, logs, tasks and review history            |
| Digest consistency and bounded supplied attempts       | Production prompts, rubrics and scoring                        |
| Local CLI and human handoff summary                    | Worker/container setup and provider execution                  |
| Tests, examples, docs and read-only CI                 | Publishers, credentials, remote writes and deployment controls |

No original source module, agent instruction, consumer-specific file, compiled
executor, configuration, log or original Git history is imported. The new code
expresses general engineering concepts, not a sanitized copy of the private engine.
Its example policy and schemas were written independently for this scope.

All committed input is authored and synthetic. The runtime reads only explicitly
supplied local JSON files and writes only requested local outputs. No model or
network API is called. No source/log field is included in summary reports or error
messages. However, exported `bundle.json` preserves the synthetic input, including
embedded source and logs. Digest fields are not a confidentiality or privacy mechanism.
Only use synthetic content, including when testing custom bundles.

The program has no telemetry, storage backend, provider environment configuration,
or command runner. Dependency installation and CI setup contact public package
registries. Local filesystem permissions still apply; no sandbox for hostile code
execution is claimed because candidate code is not executed at all.
