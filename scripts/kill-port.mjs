import { execSync } from "node:child_process";
import path from "node:path";

const port = process.argv[2] || "3000";

try {
  // Find processes listening on the given port (TCP)
  // lsof -ti:<port> returns only the PIDs
  const output = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();

  if (output) {
    const pids = output.split("\n");
    console.log(`kill-port: Found ${pids.length} processes on port ${port} (PIDs: ${pids.join(", ")})`);

    // Kill the processes (SIGKILL)
    execSync(`kill -9 ${pids.join(" ")}`);
    console.log(`kill-port: Successfully terminated processes on port ${port}.`);
  } else {
    // console.log(`kill-port: No processes found on port ${port}.`);
  }
} catch (error) {
  // If no processes are found, lsof exits with 1, which execSync throws as an error.
  // We can safely ignore this case.
  if (error.status !== 1) {
    console.error(`kill-port: Error checking/terminating processes on port ${port}:`, error.message);
  }
}
