import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["single_choice", "multiple_choice", "true_false", "fill_blank"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bankId, type, stem, options, answer, analysis, orderIndex, rawText, confidence } = body;

    if (!bankId || !type || !stem) {
      return NextResponse.json({ error: "bankId, type, stem 为必填字段" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "无效的题型" }, { status: 400 });
    }

    // Validate confidence range
    const conf = confidence ?? 1.0;
    if (typeof conf !== "number" || conf < 0 || conf > 1) {
      return NextResponse.json({ error: "confidence 必须在 0-1 之间" }, { status: 400 });
    }

    // Validate orderIndex
    const idx = orderIndex ?? 0;
    if (typeof idx !== "number" || idx < 0 || !Number.isInteger(idx)) {
      return NextResponse.json({ error: "orderIndex 必须是非负整数" }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        bankId,
        type,
        stem,
        options: JSON.stringify(options ?? []),
        answer: JSON.stringify(answer ?? []),
        analysis: analysis ?? null,
        orderIndex: idx,
        rawText: rawText ?? null,
        confidence: conf,
      },
    });
    return NextResponse.json(question, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
