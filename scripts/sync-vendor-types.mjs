// Keeps mocks/types/ byte-identical to the installed packages it mirrors.
//
// tsconfig.json maps "obsidian", "react" and "react-dom" at mocks/types/ so the
// Obsidian community scanner can type-check this repo without node_modules (see
// mocks/README.md). Because those copies are what the project actually compiles
// against, drift would mean building against stale declarations — so `npm run
// build` runs this in --check mode.
//
//   node scripts/sync-vendor-types.mjs           # verify, exit 1 on drift
//   node scripts/sync-vendor-types.mjs --write   # refresh the copies

import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// [source in node_modules, destination in mocks/types]
//
// csstype and prop-types are here because @types/react imports them: without
// them CSSProperties degrades to `any` and every inline style object in
// primitives/layout.tsx reports as an unsafe assignment. Both are leaf packages
// (no external imports of their own), so this list closes the graph.
const MIRRORS = [
  ["node_modules/obsidian/obsidian.d.ts", "mocks/types/obsidian.d.ts"],
  ["node_modules/@types/react", "mocks/types/react"],
  ["node_modules/@types/react-dom", "mocks/types/react-dom"],
  ["node_modules/csstype/index.d.ts", "mocks/types/csstype.d.ts"],
  ["node_modules/@types/prop-types/index.d.ts", "mocks/types/prop-types.d.ts"],
];

async function hashTree(target) {
  const entry = await stat(target).catch(() => null);
  if (!entry) return null;

  if (entry.isFile()) {
    return createHash("sha256").update(await readFile(target)).digest("hex");
  }

  const names = (await readdir(target)).sort();
  const hash = createHash("sha256");
  for (const name of names) {
    hash.update(name);
    hash.update(String(await hashTree(path.join(target, name))));
  }
  return hash.digest("hex");
}

const write = process.argv.includes("--write");
const drifted = [];

for (const [from, to] of MIRRORS) {
  const source = path.join(repoRoot, from);
  const dest = path.join(repoRoot, to);

  if (!(await stat(source).catch(() => null))) {
    console.error(`missing ${from} — run \`npm ci\` first`);
    process.exit(1);
  }

  if (write) {
    await rm(dest, { recursive: true, force: true });
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(source, dest, { recursive: true });
    console.log(`synced ${to}`);
  } else if ((await hashTree(source)) !== (await hashTree(dest))) {
    drifted.push(to);
  }
}

if (drifted.length > 0) {
  console.error(
    `Vendored types are stale:\n${drifted.map((p) => `  ${p}`).join("\n")}\n` +
      `Run \`npm run types:sync\` and commit the result (see mocks/README.md).`,
  );
  process.exit(1);
}

if (!write) console.log("Vendored types match node_modules.");
