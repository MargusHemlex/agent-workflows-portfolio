import { writeFileSync, mkdirSync } from "node:fs";
import { fixture, SCENARIOS } from "../src/fixtures.mjs";
import { runPipeline } from "../src/pipeline.mjs";
import { renderReport } from "../src/reporting.mjs";
for (const scenario of SCENARIOS) {
  mkdirSync(`fixtures/${scenario}`, { recursive: true });
  const bundle = fixture(scenario);
  writeFileSync(
    `fixtures/${scenario}/bundle.json`,
    JSON.stringify(bundle, null, 2) + "\n",
  );
}
const report = runPipeline(fixture("recovered"));
writeFileSync("examples/report.json", JSON.stringify(report, null, 2) + "\n");
writeFileSync("examples/report.md", renderReport(report));
