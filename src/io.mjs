import { lstatSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { TextDecoder } from "node:util";
import { dirname } from "node:path";
import { InputError } from "./contracts.mjs";
export const MAX_BYTES = 262_144;
export function readJson(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_BYTES)
    throw new InputError("invalid_input_file");
  const bytes = readFileSync(path);
  if (bytes.length > MAX_BYTES) throw new InputError("input_too_large");
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new InputError("invalid_json");
  }
}
export class OutputConflict extends Error {}
export function writeOnce(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  try {
    writeFileSync(path, data, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (lstatSync(path).isSymbolicLink() || readFileSync(path, "utf8") !== data)
      throw new OutputConflict("output_conflict");
  }
}
