import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bank = await prisma.questionBank.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
    if (!bank) {
      return NextResponse.json({ error: "题库不存在" }, { status: 404 });
    }
    return NextResponse.json(bank);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bank = await prisma.questionBank.findUnique({ where: { id } });
    if (!bank) {
      return NextResponse.json({ error: "题库不存在" }, { status: 404 });
    }
    await prisma.questionBank.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
