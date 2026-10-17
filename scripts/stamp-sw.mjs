// Copies sw/sw.template.js → public/sw.js with a build id so each release produces a new service worker.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

let id = process.env.BUILD_ID;
if (!id) { try { id = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { id = "dev"; } }
id = `${id}-${Date.now().toString(36)}`;
writeFileSync("public/sw.js", readFileSync("sw/sw.template.js", "utf8").replaceAll("__BUILD_ID__", id));
console.log(`service worker stamped: ${id}`);
