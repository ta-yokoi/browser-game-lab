import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await checkDirectory(path);
    else if (/\.(js|mjs)$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ["--check", path], {
        stdio: "inherit",
      });
      if (result.error || result.status !== 0) process.exit(1);
    }
  }
}
for (const directory of ["site", "scripts", "tests"])
  await checkDirectory(directory);
const shell = spawnSync("bash", ["-n", "scripts/setup-github.sh"], {
  stdio: "inherit",
});
if (shell.error || shell.status !== 0) process.exit(1);
console.log("All JavaScript and setup script syntax checks passed.");
