import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";

// Tiny JSON-file persistence for GHL OAuth tokens, keyed by locationId
// (a GHL "location" = one sub-account). Good enough for a single-business
// deployment; swap for a real DB if this ever serves many accounts.

function load() {
  try {
    return JSON.parse(fs.readFileSync(config.tokenStorePath, "utf8"));
  } catch {
    return {};
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(config.tokenStorePath), { recursive: true });
  fs.writeFileSync(config.tokenStorePath, JSON.stringify(data, null, 2));
}

export function getTokens(locationId) {
  return load()[locationId] || null;
}

export function setTokens(locationId, tokens) {
  const data = load();
  data[locationId] = { ...tokens, updatedAt: new Date().toISOString() };
  save(data);
}

export function getAnyLocationId() {
  const keys = Object.keys(load()).filter((k) => !k.startsWith("company:"));
  return keys[0] || null;
}
