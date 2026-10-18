#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { canonical } from "./canonical.mjs";
import { fixture, SCENARIOS } from "./fixtures.mjs";
import { InputError } from "./contracts.mjs";
import { readJson, writeOnce, OutputConflict } from "./io.mjs";
import { runPipeline, verifyReport } from "./pipeline.mjs";
import { renderReport } from "./reporting.mjs";
function options(args, allowed) {
  if (args.length % 2) throw new InputError("invalid_arguments");
  const values = {};
  for (let i = 0; i < args.length; i += 2) {
    if (
      !allowed.includes(args[i]) ||
      Object.hasOwn(values, args[i]) ||
      !args[i + 1] ||
      args[i + 1].startsWith("--")
    )
      throw new InputError("invalid_arguments");
    values[args[i]] = args[i + 1];
  }
  return values;
}
export function main(args = process.argv.slice(2)) {
  try {
    if (args.length === 1 && args[0] === "--help") {
      console.log(
        "Offline synthetic review pipeline: list | run --scenario NAME --output DIR | evaluate --bundle FILE --output DIR | verify --bundle FILE --report FILE",
      );
      return 0;
    }
    const [command, ...rest] = args;
    if (command === "list" && !rest.length) {
      console.log(
        JSON.stringify({ source: "synthetic", scenarios: SCENARIOS }),
      );
      return 0;
    }
    if (command === "verify") {
      const opts = options(rest, ["--bundle", "--report"]);
      if (!opts["--bundle"] || !opts["--report"])
        throw new InputError("invalid_arguments");
      if (!verifyReport(readJson(opts["--report"]), readJson(opts["--bundle"])))
        throw new InputError("report_integrity_mismatch");
      console.log("report_verified (consistency only)");
      return 0;
    }
    if (command !== "run" && command !== "evaluate")
      throw new InputError("invalid_arguments");
    const opts = options(
      rest,
      command === "run" ? ["--scenario", "--output"] : ["--bundle", "--output"],
    );
    if (!opts["--output"]) throw new InputError("invalid_arguments");
    if (
      command === "run" &&
      !SCENARIOS.includes(opts["--scenario"] ?? "passing")
    )
      throw new InputError("unknown_scenario");
    if (command === "evaluate" && !opts["--bundle"])
      throw new InputError("invalid_arguments");
    const bundle =
      command === "run"
        ? fixture(opts["--scenario"] ?? "passing")
        : readJson(opts["--bundle"]);
    const report = runPipeline(bundle);
    // The audit bundle preserves synthetic input; summary reports omit source text and logs.
    writeOnce(join(opts["--output"], "bundle.json"), canonical(bundle) + "\n");
    writeOnce(join(opts["--output"], "report.json"), canonical(report) + "\n");
    writeOnce(join(opts["--output"], "report.md"), renderReport(report));
    writeOnce(
      join(opts["--output"], "bundle.schema.json"),
      readFileSync(
        new URL("../schemas/bundle.schema.json", import.meta.url),
        "utf8",
      ),
    );
    writeOnce(
      join(opts["--output"], "report.schema.json"),
      readFileSync(
        new URL("../schemas/report.schema.json", import.meta.url),
        "utf8",
      ),
    );
    console.log(`${report.status} (synthetic; no publication)`);
    return report.status === "ready-for-human-review" ? 0 : 3;
  } catch (error) {
    if (error instanceof OutputConflict) {
      console.error("error: output_integrity_conflict");
      return 4;
    }
    console.error(
      `error: ${error instanceof InputError ? error.code : "invalid_input_or_output"}`,
    );
    return 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exitCode = main();
