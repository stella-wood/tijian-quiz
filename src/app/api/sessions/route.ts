import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { bankId, mode } = await request.json();

    if (!bankId || !mode) {
      return NextResponse.json({ error: "bankId 和 mode 为必填字段" }, { status: 400 });
    }

    const validModes = ["sequential", "random", "wrong"];
    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: "无效的练习模式" }, { status: 400 });
    }

    const bank = await prisma.questionBank.findUnique({ where: { id: bankId } });
    if (!bank) {
      return NextResponse.json({ error: "题库不存在" }, { status: 404 });
    }

    let questionIds: string[];

    if (mode === "wrong") {
      const wrongRecords = await prisma.wrongQuestion.findMany({
        where: { question: { bankId } },
        include: { question: { select: { id: true } } },
      });
      questionIds = wrongRecords.map((w) => w.question.id);
    } else {
      const questions = await prisma.question.findMany({
        where: { bankId },
        orderBy: { orderIndex: "asc" },
        select: { id: true },
      });
      questionIds = questions.map((q) => q.id);
    }

    if (questionIds.length === 0) {
      return NextResponse.json({ error: "没有可练习的题目" }, { status: 400 });
    }

    // Shuffle for random mode
    if (mode === "random") {
      for (let i = questionIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionIds[i], questionIds[j]] = [questionIds[j], questionIds[i]];
      }
    }

    const session = await prisma.practiceSession.create({
      data: {
        bankId,
        mode,
        questionIds: JSON.stringify(questionIds),
        totalCount: questionIds.length,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
