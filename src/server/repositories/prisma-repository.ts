import "server-only";
import { Prisma, type Question } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { AppError } from "@/features/errors";
import type { BankRepository, CreateBankInput } from "@/features/banks/contracts";
import type {
  CreateQuestionInput,
  LegacyQuestionDto,
  QuestionDto,
  QuestionRepository,
  UpdateQuestionInput,
} from "@/features/questions/contracts";
import { QuestionTypeSchema } from "@/features/questions/contracts";
import type { ImportCommitRequest, ImportRepository } from "@/features/import/contracts";
import type {
  AnswerResultDto,
  PracticeMode,
  PracticeRepository,
  SessionDto,
  SubmitAnswerInput,
} from "@/features/practice/contracts";
import type {
  BackupImportStats,
  BackupManifestV1,
  BackupRepository,
} from "@/features/backup/contracts";
import { judgeAnswer } from "@/lib/judge";
import { prisma } from "@/server/prisma";

function parseArray<T>(json: string, field: string): T[] {
  try {
    const value: unknown = JSON.parse(json);
    if (Array.isArray(value)) return value as T[];
  } catch {
    // Fall through to the consistent invalid-state error.
  }
  throw new AppError(`数据库字段 ${field} 格式无效`, "INVALID_STATE", 409);
}

function mapQuestion(question: Question): QuestionDto {
  return {
    id: question.id,
    bankId: question.bankId,
    type: QuestionTypeSchema.parse(question.type),
    stem: question.stem,
    options: parseArray(question.options, "Question.options"),
    answer: parseArray(question.answer, "Question.answer"),
    analysis: question.analysis,
    orderIndex: question.orderIndex,
    rawText: question.rawText,
    confidence: question.confidence,
    createdAt: question.createdAt.toISOString(),
  };
}

export function toLegacyQuestion(question: QuestionDto): LegacyQuestionDto {
  return {
    ...question,
    options: JSON.stringify(question.options),
    answer: JSON.stringify(question.answer),
    createdAt: new Date(question.createdAt),
  };
}

function questionData(input: CreateQuestionInput | UpdateQuestionInput) {
  return {
    ...(input.type === undefined ? {} : { type: input.type }),
    ...(input.stem === undefined ? {} : { stem: input.stem }),
    ...(input.options === undefined ? {} : { options: JSON.stringify(input.options) }),
    ...(input.answer === undefined ? {} : { answer: JSON.stringify(input.answer) }),
    ...(input.analysis === undefined ? {} : { analysis: input.analysis ?? null }),
    ...(input.orderIndex === undefined ? {} : { orderIndex: input.orderIndex }),
    ...(input.rawText === undefined ? {} : { rawText: input.rawText ?? null }),
    ...(input.confidence === undefined ? {} : { confidence: input.confidence }),
  };
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class PrismaAppRepository
  implements
    BankRepository,
    QuestionRepository,
    ImportRepository,
    PracticeRepository,
    BackupRepository
{
  listBanks() {
    return prisma.questionBank.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  findBankById(id: string) {
    return prisma.questionBank.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
  }

  createBank(input: CreateBankInput) {
    return prisma.questionBank.create({ data: { title: input.title } });
  }

  async findQuestionById(id: string) {
    const question = await prisma.question.findUnique({ where: { id } });
    return question ? mapQuestion(question) : null;
  }

  async createQuestion(input: CreateQuestionInput) {
    const bank = await prisma.questionBank.findUnique({ where: { id: input.bankId } });
    if (!bank) throw new AppError("题库不存在", "NOT_FOUND", 404);
    const created = await prisma.question.create({
      data: { bankId: input.bankId, ...questionData(input) } as Prisma.QuestionUncheckedCreateInput,
    });
    return mapQuestion(created);
  }

  async listQuestionsByBank(bankId: string) {
    const questions = await prisma.question.findMany({
      where: { bankId },
      orderBy: { orderIndex: "asc" },
    });
    return questions.map(mapQuestion);
  }

  async updateQuestion(id: string, input: UpdateQuestionInput) {
    const exists = await prisma.question.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;
    const updated = await prisma.question.update({
      where: { id },
      data: questionData(input),
    });
    return mapQuestion(updated);
  }

  async deleteQuestion(id: string) {
    const answerCount = await prisma.practiceAnswer.count({ where: { questionId: id } });
    if (answerCount > 0) {
      throw new AppError(
        "该题目已有练习记录，不能单独删除；可删除整个题库",
        "CONFLICT",
        409,
        { answerCount }
      );
    }
    const result = await prisma.question.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async deleteBank(id: string) {
    const result = await prisma.questionBank.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async commit(input: ImportCommitRequest) {
    return prisma.$transaction(async (tx) => {
      const bank = await tx.questionBank.create({ data: { title: input.title } });
      await tx.question.createMany({
        data: input.questions.map((question) => ({
          id: randomUUID(),
          bankId: bank.id,
          type: question.type,
          stem: question.stem,
          options: JSON.stringify(question.options),
          answer: JSON.stringify(question.answer),
          analysis: question.analysis ?? null,
          orderIndex: question.orderIndex,
          rawText: question.rawText ?? null,
          confidence: question.confidence,
        })),
      });
      return { bankId: bank.id, questionCount: input.questions.length };
    });
  }

  async createSession(bankId: string, mode: PracticeMode) {
    const bank = await prisma.questionBank.findUnique({ where: { id: bankId } });
    if (!bank) throw new AppError("题库不存在", "NOT_FOUND", 404);

    let questionIds: string[];
    if (mode === "wrong") {
      const records = await prisma.wrongQuestion.findMany({
        where: { question: { bankId } },
        orderBy: { lastWrongAt: "desc" },
        select: { questionId: true },
      });
      questionIds = records.map((item) => item.questionId);
    } else {
      const questions = await prisma.question.findMany({
        where: { bankId },
        orderBy: { orderIndex: "asc" },
        select: { id: true },
      });
      questionIds = questions.map((item) => item.id);
    }

    if (questionIds.length === 0) {
      throw new AppError("没有可练习的题目", "INVALID_STATE", 400);
    }
    if (mode === "random") questionIds = shuffle(questionIds);

    return prisma.practiceSession.create({
      data: {
        bankId,
        mode,
        questionIds: JSON.stringify(questionIds),
        totalCount: questionIds.length,
      },
    });
  }

  async getSession(id: string): Promise<SessionDto | null> {
    const session = await prisma.practiceSession.findUnique({
      where: { id },
      include: {
        bank: { select: { title: true } },
        answers: {
          include: { question: true },
          orderBy: { answeredAt: "asc" },
        },
      },
    });
    if (!session) return null;

    const questionIds = parseArray<string>(session.questionIds, "PracticeSession.questionIds");
    const currentId = session.finishedAt ? undefined : questionIds[session.currentIndex];
    const current = currentId
      ? await prisma.question.findUnique({ where: { id: currentId } })
      : null;

    return {
      ...session,
      status: session.finishedAt ? "completed" : "active",
      currentQuestion: current
        ? {
            id: current.id,
            type: QuestionTypeSchema.parse(current.type),
            stem: current.stem,
            options: parseArray(current.options, "Question.options"),
          }
        : null,
    };
  }

  getUnfinished(bankId: string) {
    return prisma.practiceSession.findMany({
      where: { bankId, finishedAt: null },
      orderBy: { startedAt: "desc" },
      take: 5,
    });
  }

  private async answerResultFromExisting(sessionId: string): Promise<AnswerResultDto | null> {
    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: { question: true },
          orderBy: { answeredAt: "desc" },
          take: 1,
        },
      },
    });
    const answer = session?.answers[0];
    if (!session || !answer) return null;
    return {
      ...answer,
      standardAnswer: parseArray(answer.question.answer, "Question.answer"),
      analysis: answer.question.analysis,
      isLastQuestion: session.currentIndex >= session.totalCount,
    };
  }

  async submitAnswer(id: string, input: SubmitAnswerInput): Promise<AnswerResultDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const session = await tx.practiceSession.findUnique({ where: { id } });
        if (!session) throw new AppError("练习会话不存在", "NOT_FOUND", 404);

        if (session.finishedAt) {
          const existing = await tx.practiceAnswer.findFirst({
            where: { sessionId: id },
            include: { question: true },
            orderBy: { answeredAt: "desc" },
          });
          if (existing) {
            return {
              ...existing,
              standardAnswer: parseArray(existing.question.answer, "Question.answer"),
              analysis: existing.question.analysis,
              isLastQuestion: session.currentIndex >= session.totalCount,
            };
          }
          throw new AppError("练习已结束", "INVALID_STATE", 400);
        }

        const questionIds = parseArray<string>(session.questionIds, "PracticeSession.questionIds");
        const questionId = questionIds[session.currentIndex];
        if (!questionId) throw new AppError("所有题目已完成", "INVALID_STATE", 400);

        const existing = await tx.practiceAnswer.findUnique({
          where: { sessionId_questionId: { sessionId: id, questionId } },
          include: { question: true },
        });
        if (existing) {
          return {
            ...existing,
            standardAnswer: parseArray(existing.question.answer, "Question.answer"),
            analysis: existing.question.analysis,
            isLastQuestion: session.currentIndex + 1 >= questionIds.length,
          };
        }

        const question = await tx.question.findUnique({ where: { id: questionId } });
        if (!question) throw new AppError("题目不存在", "NOT_FOUND", 404);
        const standardAnswer = parseArray<string>(question.answer, "Question.answer");
        const correct = judgeAnswer(
          QuestionTypeSchema.parse(question.type),
          input.userAnswer,
          standardAnswer
        );
        const newIndex = session.currentIndex + 1;
        const isLastQuestion = newIndex >= questionIds.length;

        const updated = await tx.practiceSession.updateMany({
          where: { id, currentIndex: session.currentIndex, finishedAt: null },
          data: {
            currentIndex: { increment: 1 },
            correctCount: correct ? { increment: 1 } : undefined,
            finishedAt: isLastQuestion ? new Date() : undefined,
          },
        });
        if (updated.count !== 1) {
          throw new AppError("答题状态已更新，请刷新后重试", "CONFLICT", 409);
        }

        const answer = await tx.practiceAnswer.create({
          data: {
            sessionId: id,
            questionId,
            userAnswer: JSON.stringify(input.userAnswer),
            isCorrect: correct,
            durationMs: input.durationMs,
          },
        });

        if (!correct) {
          await tx.wrongQuestion.upsert({
            where: { questionId },
            create: { questionId },
            update: { wrongCount: { increment: 1 }, lastWrongAt: new Date() },
          });
        }

        return {
          ...answer,
          standardAnswer,
          analysis: question.analysis,
          isLastQuestion,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existing = await this.answerResultFromExisting(id);
        if (existing) return existing;
      }
      throw error;
    }
  }

  async finish(id: string) {
    const session = await prisma.practiceSession.findUnique({ where: { id } });
    if (!session) throw new AppError("练习会话不存在", "NOT_FOUND", 404);
    if (session.finishedAt) return session;
    return prisma.practiceSession.update({
      where: { id },
      data: { finishedAt: new Date() },
    });
  }

  listWrong(bankId?: string) {
    return prisma.wrongQuestion.findMany({
      where: bankId ? { question: { bankId } } : {},
      include: {
        question: { include: { bank: { select: { id: true, title: true } } } },
      },
      orderBy: { lastWrongAt: "desc" },
    });
  }

  async exportManifest(): Promise<BackupManifestV1> {
    const [banks, questions, sessions, answers, wrongQuestions] = await prisma.$transaction([
      prisma.questionBank.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.question.findMany({ orderBy: [{ bankId: "asc" }, { orderIndex: "asc" }] }),
      prisma.practiceSession.findMany({ orderBy: { startedAt: "asc" } }),
      prisma.practiceAnswer.findMany({ orderBy: { answeredAt: "asc" } }),
      prisma.wrongQuestion.findMany({ orderBy: { lastWrongAt: "asc" } }),
    ]);
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      appVersion: "0.1.0",
      data: {
        banks: banks.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
        questions: questions.map((item) => ({ ...mapQuestion(item), createdAt: item.createdAt.toISOString() })),
        sessions: sessions.map((item) => ({
          ...item,
          mode: item.mode as PracticeMode,
          questionIds: parseArray(item.questionIds, "PracticeSession.questionIds"),
          startedAt: item.startedAt.toISOString(),
          finishedAt: item.finishedAt?.toISOString() ?? null,
        })),
        answers: answers.map((item) => ({
          ...item,
          userAnswer: parseArray(item.userAnswer, "PracticeAnswer.userAnswer"),
          answeredAt: item.answeredAt.toISOString(),
        })),
        wrongQuestions: wrongQuestions.map((item) => ({
          ...item,
          lastWrongAt: item.lastWrongAt.toISOString(),
        })),
      },
    };
  }

  async importManifest(manifest: BackupManifestV1): Promise<BackupImportStats> {
    const names = ["banks", "questions", "sessions", "answers", "wrongQuestions"] as const;
    const empty = () => Object.fromEntries(names.map((name) => [name, 0])) as Record<(typeof names)[number], number>;

    return prisma.$transaction(async (tx) => {
      const [banks, questions, sessions, answers, wrongQuestions] = await Promise.all([
        tx.questionBank.findMany(),
        tx.question.findMany(),
        tx.practiceSession.findMany(),
        tx.practiceAnswer.findMany(),
        tx.wrongQuestion.findMany(),
      ]);

      const existing = {
        banks: new Map(banks.map((item) => [item.id, { ...item, createdAt: item.createdAt.toISOString() }])),
        questions: new Map(questions.map((item) => [item.id, { ...mapQuestion(item), createdAt: item.createdAt.toISOString() }])),
        sessions: new Map(sessions.map((item) => [item.id, {
          ...item,
          mode: item.mode,
          questionIds: parseArray(item.questionIds, "PracticeSession.questionIds"),
          startedAt: item.startedAt.toISOString(),
          finishedAt: item.finishedAt?.toISOString() ?? null,
        }])),
        answers: new Map(answers.map((item) => [item.id, {
          ...item,
          userAnswer: parseArray(item.userAnswer, "PracticeAnswer.userAnswer"),
          answeredAt: item.answeredAt.toISOString(),
        }])),
        wrongQuestions: new Map(wrongQuestions.map((item) => [item.id, {
          ...item,
          lastWrongAt: item.lastWrongAt.toISOString(),
        }])),
      };

      const conflicts: { entity: string; id: string }[] = [];
      const missing: typeof manifest.data = {
        banks: [], questions: [], sessions: [], answers: [], wrongQuestions: [],
      };
      const skipped = empty();
      const inserted = empty();

      for (const name of names) {
        for (const item of manifest.data[name] as Array<{ id: string }>) {
          const current = existing[name].get(item.id as never);
          if (!current) {
            (missing[name] as Array<{ id: string }>).push(item);
          } else if (JSON.stringify(current) === JSON.stringify(item)) {
            skipped[name] += 1;
          } else {
            conflicts.push({ entity: name, id: item.id });
          }
        }
      }

      const answerKeys = new Map(answers.map((item) => [`${item.sessionId}:${item.questionId}`, item.id]));
      for (const item of missing.answers) {
        const id = answerKeys.get(`${item.sessionId}:${item.questionId}`);
        if (id) conflicts.push({ entity: "answers", id: item.id });
      }
      const wrongKeys = new Map(wrongQuestions.map((item) => [item.questionId, item.id]));
      for (const item of missing.wrongQuestions) {
        const id = wrongKeys.get(item.questionId);
        if (id) conflicts.push({ entity: "wrongQuestions", id: item.id });
      }

      if (conflicts.length > 0) {
        throw new AppError("备份与现有数据冲突，未导入任何内容", "CONFLICT", 409, conflicts);
      }

      if (missing.banks.length) {
        await tx.questionBank.createMany({ data: missing.banks.map((item) => ({ ...item, createdAt: new Date(item.createdAt) })) });
        inserted.banks = missing.banks.length;
      }
      if (missing.questions.length) {
        await tx.question.createMany({ data: missing.questions.map((item) => ({
          ...item,
          options: JSON.stringify(item.options),
          answer: JSON.stringify(item.answer),
          createdAt: new Date(item.createdAt),
        })) });
        inserted.questions = missing.questions.length;
      }
      if (missing.sessions.length) {
        await tx.practiceSession.createMany({ data: missing.sessions.map((item) => ({
          ...item,
          questionIds: JSON.stringify(item.questionIds),
          startedAt: new Date(item.startedAt),
          finishedAt: item.finishedAt ? new Date(item.finishedAt) : null,
        })) });
        inserted.sessions = missing.sessions.length;
      }
      if (missing.answers.length) {
        await tx.practiceAnswer.createMany({ data: missing.answers.map((item) => ({
          ...item,
          userAnswer: JSON.stringify(item.userAnswer),
          answeredAt: new Date(item.answeredAt),
        })) });
        inserted.answers = missing.answers.length;
      }
      if (missing.wrongQuestions.length) {
        await tx.wrongQuestion.createMany({ data: missing.wrongQuestions.map((item) => ({
          ...item,
          lastWrongAt: new Date(item.lastWrongAt),
        })) });
        inserted.wrongQuestions = missing.wrongQuestions.length;
      }

      return { inserted, skipped };
    });
  }
}
