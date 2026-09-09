import { readFile, rm, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const databasePath = path.resolve(root, "prisma", "e2e.db");
const databaseUrl = `file:${databasePath.replaceAll("\\", "/")}`;
const pidPath = path.resolve(root, "prisma", "e2e-server.pid");

function stopProcess(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return;
  if (process.platform === "win32") {
    try { process.kill(pid, "SIGKILL"); } catch { /* already stopped */ }
  } else {
    try { process.kill(-pid, "SIGTERM"); } catch { /* already stopped */ }
  }
}

try {
  for (const pid of (await readFile(pidPath, "utf8")).split(/\s+/).map(Number)) {
    stopProcess(pid);
  }
} catch {
  // No previous E2E process to clean up.
}

for (const file of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
  await rm(file, { force: true });
}

const prismaCli = path.resolve(root, "node_modules", "prisma", "build", "index.js");
const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
  cwd: root,
  env: { ...process.env, DATABASE_URL: databaseUrl, RUST_LOG: "debug" },
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const nextCli = path.resolve(root, "node_modules", "next", "dist", "bin", "next");
const server = spawn(process.execPath, [nextCli, "dev", "--webpack", "--hostname", "127.0.0.1", "-p", "3100"], {
  cwd: root,
  env: { ...process.env, DATABASE_URL: databaseUrl },
  detached: true,
  stdio: "ignore",
  windowsHide: true,
});
server.unref();

function listenerPid() {
  if (process.platform !== "win32") return undefined;
  const result = spawnSync("netstat", ["-ano", "-p", "tcp"], { encoding: "utf8" });
  const row = result.stdout.split(/\r?\n/).find((line) => /:3100\s+.*LISTENING/i.test(line));
  return Number(row?.trim().split(/\s+/).at(-1));
}

const deadline = Date.now() + 60_000;
while (Date.now() < deadline) {
  try {
    const response = await fetch("http://127.0.0.1:3100/import");
    if (response.ok) {
      const pids = [server.pid, listenerPid()].filter(
        (pid) => Number.isInteger(pid) && Number(pid) > 0
      );
      await writeFile(pidPath, pids.join("\n"), "utf8");
      process.exit(0);
    }
  } catch {
    // Server is still starting.
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

stopProcess(server.pid);
throw new Error("E2E 测试服务器启动超时");
