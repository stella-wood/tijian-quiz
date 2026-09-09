// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { BackupService } from "@/features/backup/service";
import { PrismaAppRepository } from "@/server/repositories/prisma-repository";
import { prisma } from "@/server/prisma";

const repository = new PrismaAppRepository();
const backupService = new BackupService(repository);

beforeEach(async () => {
  await prisma.wrongQuestion.deleteMany();
  await prisma.practiceAnswer.deleteMany();
  await prisma.practiceSession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionBank.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function seed() {
  const result = await repository.commit({
    title: "集成测试题库",
    questions: [{
      type: "single_choice",
      stem: "测试题干内容",
      options: [{ key: "A", content: "正确" }, { key: "B", content: "错误" }],
      answer: ["A"],
      analysis: "测试解析",
      orderIndex: 1,
      rawText: null,
      confidence: 1,
    }],
  });
  return result;
}

describe("PrismaAppRepository", () => {
  it("commits an import atomically", async () => {
    const result = await seed();
    expect(result.questionCount).toBe(1);
    expect(await prisma.questionBank.count()).toBe(1);
    expect(await prisma.question.count()).toBe(1);
  });

  it("makes answer submission idempotent", async () => {
    const bank = await seed();
    const session = await repository.createSession(bank.bankId, "sequential") as { id: string };
    const first = await repository.submitAnswer(session.id, { userAnswer: ["B"], durationMs: 100 });
    const repeated = await repository.submitAnswer(session.id, { userAnswer: ["B"], durationMs: 100 });
    expect(repeated.id).toBe(first.id);
    expect(await prisma.practiceAnswer.count()).toBe(1);
    expect(await prisma.wrongQuestion.count()).toBe(1);
    expect((await prisma.practiceSession.findUniqueOrThrow({ where: { id: session.id } })).currentIndex).toBe(1);
  });

  it("exports and re-imports the same backup idempotently", async () => {
    await seed();
    const manifest = await backupService.exportManifest();
    const result = await backupService.importManifest(manifest);
    expect(result.inserted.banks).toBe(0);
    expect(result.skipped.banks).toBe(1);
    expect(result.skipped.questions).toBe(1);
  });

  it("rolls back backup conflicts", async () => {
    await seed();
    const manifest = await backupService.exportManifest();
    manifest.data.banks[0].title = "冲突标题";
    await expect(backupService.importManifest(manifest)).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await prisma.questionBank.findFirstOrThrow()).title).toBe("集成测试题库");
  });
});
