import { readFile, rm } from "node:fs/promises";
import path from "node:path";

export default async function teardown() {
  const root = process.cwd();
  const pidPath = path.resolve(root, "prisma", "e2e-server.pid");
  try {
    const pids = (await readFile(pidPath, "utf8")).split(/\s+/).map(Number);
    for (const pid of pids) {
      if (!Number.isInteger(pid) || pid <= 0) continue;
      if (process.platform === "win32") {
        try { process.kill(pid, "SIGKILL"); } catch { /* already stopped */ }
      } else {
        try { process.kill(-pid, "SIGTERM"); } catch { /* already stopped */ }
      }
    }
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const databasePath = path.resolve(root, "prisma", "e2e.db");
    for (const file of [pidPath, databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          await rm(file, { force: true });
          break;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }
  }
}
