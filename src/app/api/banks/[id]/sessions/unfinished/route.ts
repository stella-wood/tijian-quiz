import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessions = await prisma.practiceSession.findMany({
      where: {
        bankId: id,
        finishedAt: null,
      },
      orderBy: { startedAt: "desc" },
      take: 5,
    });
    return NextResponse.json(sessions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
