import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "public");

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

for (const file of [
  "index.html",
  "styles.css",
  "sw.js",
  "manifest.webmanifest",
  "robots.txt"
]) {
  await fs.copyFile(path.join(root, file), path.join(out, file));
}

for (const dir of ["js", "shared", "icons"]) {
  await fs.cp(path.join(root, dir), path.join(out, dir), { recursive: true });
}

console.log("Charlotte's Quest frontend built into public/");
