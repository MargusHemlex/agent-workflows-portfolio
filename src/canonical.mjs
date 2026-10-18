import { createHash } from "node:crypto";

// Canonical JSON for this bounded JSON contract, not a claimed RFC 8785 implementation.
export function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
    .join(",")}}`;
}
export function digest(value) {
  return `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;
}
export function candidateDigest(files) {
  return digest(
    [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
  );
}
export function evidenceDigest(checks) {
  return digest(
    [...checks].sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    ),
  );
}
