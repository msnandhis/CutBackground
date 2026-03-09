import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const candidates = [
  process.env.DOCKER_BIN,
  "/Applications/Docker.app/Contents/Resources/bin/docker",
  "/usr/local/bin/docker",
  "/opt/homebrew/bin/docker",
].filter(Boolean);

function isExecutable(filepath) {
  try {
    fs.accessSync(filepath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDockerBinary() {
  for (const candidate of candidates) {
    if (candidate && isExecutable(candidate)) {
      return candidate;
    }
  }

  return "docker";
}

const dockerBinary = resolveDockerBinary();
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    `docker-cli: usage: node ${path.basename(process.argv[1])} <docker arguments>`
  );
  process.exit(1);
}

const child = spawn(dockerBinary, args, {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
