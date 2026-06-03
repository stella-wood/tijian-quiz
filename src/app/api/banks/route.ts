import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const banks = await prisma.questionBank.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(banks);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "题库名称不能为空" }, { status: 400 });
    }
    const bank = await prisma.questionBank.create({
      data: { title: title.trim() },
    });
    return NextResponse.json(bank, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
