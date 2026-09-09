import { copyFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const envText = await readFile(envPath, "utf8");
const match = envText.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);

if (!match) {
  throw new Error(".env 中缺少 DATABASE_URL");
}

const databaseUrl = process.env.DATABASE_URL?.trim() || match[1].trim();
process.env.DATABASE_URL = databaseUrl;

function runPrisma(args) {
  const prismaCli = path.resolve(root, "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!databaseUrl.startsWith("file:")) {
  runPrisma(["migrate", "deploy"]);
  process.exit(0);
}

const rawPath = databaseUrl.slice("file:".length);
const databasePath = path.isAbsolute(rawPath)
  ? rawPath
  : path.resolve(root, "prisma", rawPath);
process.env.DATABASE_URL = `file:${databasePath.replaceAll("\\", "/")}`;
process.env.RUST_LOG ??= "debug";

if (existsSync(databasePath)) {
  const prisma = new PrismaClient();
  const migrationTable = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'"
  );

  if (migrationTable.length === 0) {
    const expected = [
      "PracticeAnswer",
      "PracticeSession",
      "Question",
      "QuestionBank",
      "WrongQuestion",
    ];
    const rows = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const names = rows.map((row) => row.name).filter((name) => name !== "sqlite_sequence");
    if (JSON.stringify(names) !== JSON.stringify(expected)) {
      await prisma.$disconnect();
      throw new Error("现有数据库结构与 V1 基线不一致，已停止自动迁移");
    }

    const duplicates = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) AS count FROM (SELECT sessionId, questionId FROM PracticeAnswer GROUP BY sessionId, questionId HAVING COUNT(*) > 1)"
    );
    if (Number(duplicates[0]?.count ?? 0) > 0) {
      await prisma.$disconnect();
      throw new Error("现有数据库包含重复答题记录，已停止自动迁移");
    }

    await prisma.$disconnect();
    const stamp = new Date().toISOString().replaceAll(":", "-");
    const backupPath = `${databasePath}.bak-${stamp}`;
    await copyFile(databasePath, backupPath);
    console.log(`已备份现有数据库：${backupPath}`);
    runPrisma(["migrate", "resolve", "--applied", "0001_baseline"]);
  } else {
    await prisma.$disconnect();
  }
}

runPrisma(["migrate", "deploy"]);
