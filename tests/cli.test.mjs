import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fixture } from "../src/fixtures.mjs";
import { readJson, MAX_BYTES } from "../src/io.mjs";
const cli = resolve("src/cli.mjs");
const exec = (...args) =>
  spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
test("CLI exports, verifies, rejects tampered reports and refuses conflicting output", () => {
  const dir = mkdtempSync(join(tmpdir(), "review-pipeline-"));
  try {
    const out = join(dir, "accepted");
    assert.equal(
      exec("run", "--scenario", "recovered", "--output", out).status,
      0,
    );
    assert.equal(
      exec("run", "--scenario", "recovered", "--output", out).status,
      0,
    );
    assert.equal(
      exec(
        "verify",
        "--bundle",
        join(out, "bundle.json"),
        "--report",
        join(out, "report.json"),
      ).status,
      0,
    );
    assert.equal(
      exec("run", "--scenario", "stale-review", "--output", out).status,
      4,
    );
    const bad = JSON.parse(readFileSync(join(out, "report.json")));
    bad.status = "awaiting-revision";
    writeFileSync(join(dir, "edited.json"), JSON.stringify(bad));
    assert.equal(
      exec(
        "verify",
        "--bundle",
        join(out, "bundle.json"),
        "--report",
        join(dir, "edited.json"),
      ).status,
      2,
    );
    const blocked = join(dir, "blocked");
    assert.equal(
      exec("run", "--scenario", "exhausted-budget", "--output", blocked).status,
      3,
    );
    assert.equal(
      exec(
        "evaluate",
        "--bundle",
        join(out, "bundle.json"),
        "--output",
        join(dir, "evaluated"),
      ).status,
      0,
    );
    assert.deepEqual(
      JSON.parse(readFileSync(join(out, "report.schema.json"))).$id,
      "urn:agent-review:report:v1",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("CLI argument and file errors use controlled codes without echoing submitted material", () => {
  const dir = mkdtempSync(join(tmpdir(), "review-errors-"));
  try {
    const bad = join(dir, "bad.json");
    writeFileSync(bad, "{ SYNTHETIC_SENSITIVE_SENTINEL");
    const result = exec(
      "evaluate",
      "--bundle",
      bad,
      "--output",
      join(dir, "out"),
    );
    assert.equal(result.status, 2);
    assert.equal(result.stderr.trim(), "error: invalid_json");
    assert.ok(!result.stderr.includes("SYNTHETIC_SENSITIVE_SENTINEL"));
    assert.equal(
      exec("run", "--scenario", "unknown", "--output", dir).status,
      2,
    );
    assert.equal(exec("run", "--output", dir, "--output", dir).status, 2);
    assert.equal(exec("list", "--extra", "x").status, 2);
    assert.equal(exec("--help").status, 0);
    assert.equal(JSON.parse(exec("list").stdout).scenarios.length, 8);
    writeFileSync(bad, Buffer.alloc(MAX_BYTES + 1));
    assert.throws(() => readJson(bad), /invalid_input_file/);
    writeFileSync(bad, Buffer.from([0xff]));
    assert.throws(() => readJson(bad), /invalid_json/);
    const input = join(dir, "bundle.json");
    writeFileSync(input, JSON.stringify(fixture("passing")));
    symlinkSync(input, join(dir, "link.json"));
    assert.throws(() => readJson(join(dir, "link.json")), /invalid_input_file/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("CLI runtime succeeds with network access blocked and no provider credentials", () => {
  const dir = mkdtempSync(join(tmpdir(), "review-offline-"));
  try {
    const preload = join(dir, "offline.cjs");
    writeFileSync(
      preload,
      `const net = require('node:net'); net.Socket.prototype.connect = function () { throw new Error('network disabled'); }; globalThis.fetch = () => { throw new Error('network disabled'); };`,
    );
    const result = spawnSync(
      process.execPath,
      [
        "--require",
        preload,
        cli,
        "run",
        "--scenario",
        "passing",
        "--output",
        join(dir, "out"),
      ],
      { encoding: "utf8", env: { PATH: process.env.PATH } },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      JSON.parse(readFileSync(join(dir, "out/report.json"))).status,
      "ready-for-human-review",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
