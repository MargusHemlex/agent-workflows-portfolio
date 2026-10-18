# Synthetic examples

`fixtures/` holds all eight authored input bundles. Source strings, logs, SHA labels
and review decisions are fictional. They are not records of model or command execution.
`examples/report.json` and `report.md` show the `recovered` two-attempt scenario.

```sh
node src/cli.mjs run --scenario recovered --output pipeline-output/recovered
node src/cli.mjs verify --bundle pipeline-output/recovered/bundle.json --report pipeline-output/recovered/report.json
node src/cli.mjs evaluate --bundle fixtures/stale-review/bundle.json --output pipeline-output/stale
```

The final command intentionally exits 3. Inspect `stale/report.md`: the review binds
an earlier synthetic SHA and cannot authorize the current candidate. Repeat with
`failed-check`, `missing-evidence` or `exhausted-budget` for other stop conditions.

For a tamper example, edit a copied report's status and run `verify` against its
unchanged bundle. It exits 2. Changing the report digest too cannot bypass full
recomputation. Modifying both a bundle and its approvals consistently is possible:
these are unauthenticated authored examples, not a trust or signature system.

Regenerate committed fixtures and examples with `npm run examples`, then format and
test them. Do not replace them with private projects, real prompts, keys or raw logs.
