import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.practiceSession.findUnique({
      where: { id },
      include: {
        bank: { select: { title: true } },
        answers: true,
      },
    });
    if (!session) {
      return NextResponse.json({ error: "练习会话不存在" }, { status: 404 });
    }

    if (session.finishedAt) {
      return NextResponse.json(session);
    }

    const questionIds: string[] = JSON.parse(session.questionIds);
    if (session.currentIndex >= questionIds.length) {
      return NextResponse.json({ ...session, currentQuestion: null });
    }

    const currentQuestionId = questionIds[session.currentIndex];
    const currentQuestion = await prisma.question.findUnique({
      where: { id: currentQuestionId },
    });

    return NextResponse.json({
      ...session,
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            type: currentQuestion.type,
            stem: currentQuestion.stem,
            options: JSON.parse(currentQuestion.options),
            // answer intentionally omitted — only returned after user submits
          }
        : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
