// Repository self-check: plugin manifests, entry files and JS syntax.
//
// No dependencies and no network: `npm run check` works on a fresh clone.
// The GitHub Actions workflow runs the same script.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pluginsRoot = join(root, "plugins");
const failures = [];
const notes = [];

/** Record one broken invariant. */
function fail(message) {
  failures.push(message);
}

/** Record an advisory that should not fail CI. */
function note(message) {
  notes.push(message);
}

/** Require a regular file. */
function requireFile(path, label) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    fail(`${label}: missing file ${relative(root, path)}`);
  }
}

/** Collect every .js file below a directory. */
function javascriptFiles(directory) {
  const files = [];
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...javascriptFiles(path));
    else if (entry.isFile() && extname(entry.name) === ".js") files.push(path);
  }
  return files.sort();
}

/** Parse JSON with a readable failure. */
function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    return null;
  }
}

// ---- repository root -------------------------------------------------------

const rootManifest = readJson(join(root, "package.json"), "root package.json");
if (rootManifest !== null) {
  if (rootManifest.private !== true) fail("root package.json: must stay private");
  if (rootManifest.type !== "module") fail("root package.json: must be ESM (type: module)");
}

if (!existsSync(pluginsRoot)) {
  fail("missing plugins/ directory");
}

// ---- every plugin ----------------------------------------------------------

const pluginDirectories = existsSync(pluginsRoot)
  ? readdirSync(pluginsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort()
  : [];

if (pluginDirectories.length === 0) {
  fail("plugins/: no plugin directories found");
}

for (const directoryName of pluginDirectories) {
  const directory = join(pluginsRoot, directoryName);
  const manifestPath = join(directory, "package.json");
  if (!existsSync(manifestPath)) {
    fail(`${directoryName}: missing package.json`);
    continue;
  }

  const manifest = readJson(manifestPath, `${directoryName}/package.json`);
  if (manifest === null) continue;

  for (const field of ["name", "version", "description", "license", "main"]) {
    if (typeof manifest[field] !== "string" || manifest[field].trim() === "") {
      fail(`${directoryName}/package.json: missing string field "${field}"`);
    }
  }

  if (typeof manifest.name === "string" && manifest.name !== `dsh-${directoryName}`) {
    fail(
      `${directoryName}/package.json: name "${manifest.name}" must be "dsh-${directoryName}" ` +
        "(folder name without the dsh- prefix)",
    );
  }

  if (manifest.type !== "module") {
    fail(`${directoryName}/package.json: must be ESM (type: module)`);
  }

  if (manifest.private === true) {
    note(`${directoryName}: marked private, so it cannot be published to npm`);
  }

  if (typeof manifest.main === "string") {
    requireFile(join(directory, manifest.main), `${directoryName}: main entry`);
  }

  const exportedRoot = manifest.exports?.["."];
  if (typeof exportedRoot === "string") {
    requireFile(join(directory, exportedRoot), `${directoryName}: exports["."]`);
  }

  // Browser half: declared through the dsh.client manifest, loaded by path.
  if (manifest.dsh?.client !== undefined) {
    const client = manifest.dsh.client;
    if (client.platform !== "web") {
      fail(`${directoryName}: dsh.client.platform must be "web"`);
    }
    if (!Array.isArray(client.inject) || client.inject.some((item) => typeof item !== "string")) {
      fail(`${directoryName}: dsh.client.inject must be an array of service names`);
    }
    const clientEntry = join(directory, "lib/client.js");
    requireFile(clientEntry, `${directoryName}: client entry`);
    if (existsSync(clientEntry)) {
      const source = readFileSync(clientEntry, "utf8");
      if (!source.includes("__ModuleLoader__.load")) {
        fail(`${directoryName}: lib/client.js must register through window.__ModuleLoader__.load`);
      }
    }
  }

  requireFile(join(directory, "README.md"), `${directoryName}: README`);

  for (const file of javascriptFiles(join(directory, "lib"))) {
    try {
      // `stdio: "ignore"` keeps this working in sandboxes that do not allow
      // piping a child process' output; the exit code carries the verdict.
      execFileSync(process.execPath, ["--check", file], { stdio: "ignore", windowsHide: true });
    } catch {
      fail(`${relative(root, file)}: syntax error`);
    }
  }
}

// ---- report ----------------------------------------------------------------

for (const message of notes) console.warn(`note: ${message}`);

if (failures.length > 0) {
  console.error(`\ncheck failed (${failures.length}):`);
  for (const message of failures) console.error(`  - ${message}`);
  process.exit(1);
}

console.log(`check passed: ${pluginDirectories.length} plugin(s)`);
for (const directoryName of pluginDirectories) console.log(`  - ${directoryName}`);
