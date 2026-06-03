import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
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

    const updated = await prisma.practiceSession.update({
      where: { id },
      data: { finishedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
