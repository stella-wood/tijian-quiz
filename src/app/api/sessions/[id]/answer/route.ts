import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { judgeAnswer } from "@/lib/judge";
import type { QuestionType } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.practiceSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: "练习会话不存在" }, { status: 404 });
    }
    if (session.finishedAt) {
      return NextResponse.json({ error: "练习已结束" }, { status: 400 });
    }

    const questionIds: string[] = JSON.parse(session.questionIds);
    if (session.currentIndex >= questionIds.length) {
      return NextResponse.json({ error: "所有题目已完成" }, { status: 400 });
    }

    const questionId = questionIds[session.currentIndex];
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    const { userAnswer, durationMs } = await request.json();
    if (!Array.isArray(userAnswer)) {
      return NextResponse.json({ error: "答案格式错误" }, { status: 400 });
    }

    const standardAnswer: string[] = JSON.parse(question.answer);
    const correct = judgeAnswer(question.type as QuestionType, userAnswer, standardAnswer);

    const answer = await prisma.practiceAnswer.create({
      data: {
        sessionId: id,
        questionId,
        userAnswer: JSON.stringify(userAnswer),
        isCorrect: correct,
        durationMs: durationMs ?? 0,
      },
    });

    const newIndex = session.currentIndex + 1;
    const isLastQuestion = newIndex >= questionIds.length;

    await prisma.practiceSession.update({
      where: { id },
      data: {
        currentIndex: newIndex,
        correctCount: correct ? session.correctCount + 1 : session.correctCount,
        finishedAt: isLastQuestion ? new Date() : undefined,
      },
    });

    if (!correct) {
      await prisma.wrongQuestion.upsert({
        where: { questionId },
        create: { questionId, wrongCount: 1 },
        update: { wrongCount: { increment: 1 }, lastWrongAt: new Date() },
      });
    }

    return NextResponse.json({
      ...answer,
      standardAnswer,
      analysis: question.analysis,
      isLastQuestion,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
