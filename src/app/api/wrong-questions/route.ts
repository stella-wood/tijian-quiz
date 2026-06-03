import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get("bankId");

    const where = bankId ? { question: { bankId } } : {};

    const wrongQuestions = await prisma.wrongQuestion.findMany({
      where,
      include: {
        question: {
          include: { bank: { select: { id: true, title: true } } },
        },
      },
      orderBy: { lastWrongAt: "desc" },
    });

    return NextResponse.json(wrongQuestions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
