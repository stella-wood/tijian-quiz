import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const databasePath = path.resolve(process.cwd(), "prisma", "test.db");
const databaseUrl = `file:${databasePath.replaceAll("\\", "/")}`;

async function removeDatabase() {
  await Promise.all(
    [databasePath, `${databasePath}-wal`, `${databasePath}-shm`].map((file) =>
      rm(file, { force: true }).catch(() => undefined)
    )
  );
}

export default async function setup() {
  await removeDatabase();
  const prismaCli = path.resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl, RUST_LOG: "debug" },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("无法创建临时测试数据库");
  return async () => {
    await removeDatabase();
  };
}
