import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
// Limited pattern checking; only paths and pattern IDs are printed.
const patterns = {
  private_key: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  github_token:
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  provider_key: /\bsk-(?:ant-|proj-)[A-Za-z0-9_-]{24,}\b/,
  storage_key: /AccountKey=[A-Za-z0-9+/]{40,}={0,2}/,
  credential_url: /[a-z]+:\/\/[^\s/:]+:[^\s/@]{8,}@/,
};
const git = (...args) => execFileSync("git", args, { maxBuffer: 20_000_000 });
let failed = false;
function check(path, bytes) {
  if (/(^|\/)\.env|\.(key|pem|pfx|p12|pdf|docx?|zip|cjs)$/i.test(path)) {
    console.error(`prohibited_file:${path}`);
    failed = true;
  }
  for (const [name, pattern] of Object.entries(patterns))
    if (pattern.test(bytes)) {
      console.error(`${name}:${path}`);
      failed = true;
    }
}
for (const name of git("ls-files", "-z").toString().split("\0").filter(Boolean))
  check(name, readFileSync(name).toString());
const seen = new Set();
for (const commit of git("rev-list", "--all")
  .toString()
  .trim()
  .split("\n")
  .filter(Boolean)) {
  for (const entry of git("ls-tree", "-rz", commit)
    .toString()
    .split("\0")
    .filter(Boolean)) {
    const [meta, path] = entry.split("\t");
    const [, type, oid] = meta.split(" ");
    if (type !== "blob" || seen.has(`${oid}:${path}`)) continue;
    seen.add(`${oid}:${path}`);
    check(path, git("cat-file", "blob", oid).toString());
  }
}
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (Object.keys(pkg.dependencies).some((name) => name !== "ajv")) {
  console.error("unexpected_runtime_dependency");
  failed = true;
}
console.log(failed ? "publication_check_failed" : "publication_check_passed");
process.exitCode = failed ? 1 : 0;
