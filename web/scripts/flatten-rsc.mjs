// Post-export fix for static hosting of `output: "export"` (Vercel / any static host).
// Next 16 writes RSC segment payloads as  <route>/__next.<seg>/__PAGE__.txt
// but client navigation requests        <route>/__next.<seg>.__PAGE__.txt
// Copy every file inside a "__next.*" folder to the dot-joined sibling name.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "out");
let copied = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("__next.")) flatten(full, path.join(dir, entry.name));
    else walk(full);
  }
}

function flatten(folder, prefix) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name);
    const target = `${prefix}.${entry.name}`;
    if (entry.isDirectory()) flatten(full, target);
    else if (!fs.existsSync(target)) {
      fs.copyFileSync(full, target);
      copied++;
    }
  }
}

if (!fs.existsSync(OUT)) {
  console.error("flatten-rsc: no out/ folder — run next build first");
  process.exit(1);
}
walk(OUT);
console.log(`flatten-rsc: wrote ${copied} RSC payload alias(es)`);
