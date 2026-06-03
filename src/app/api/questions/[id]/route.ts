import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["single_choice", "multiple_choice", "true_false", "fill_blank"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }
    return NextResponse.json(question);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    const body = await request.json();

    // Validate type if provided
    if (body.type !== undefined && !VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "无效的题型" }, { status: 400 });
    }

    // Validate orderIndex if provided
    if (body.orderIndex !== undefined) {
      const idx = body.orderIndex;
      if (typeof idx !== "number" || idx < 0 || !Number.isInteger(idx)) {
        return NextResponse.json({ error: "orderIndex 必须是非负整数" }, { status: 400 });
      }
    }

    // Validate confidence if provided
    if (body.confidence !== undefined) {
      const conf = body.confidence;
      if (typeof conf !== "number" || conf < 0 || conf > 1) {
        return NextResponse.json({ error: "confidence 必须在 0-1 之间" }, { status: 400 });
      }
    }

    // Validate options/answer are arrays before stringify
    if (body.options !== undefined && !Array.isArray(body.options)) {
      return NextResponse.json({ error: "options 必须是数组" }, { status: 400 });
    }
    if (body.answer !== undefined && !Array.isArray(body.answer)) {
      return NextResponse.json({ error: "answer 必须是数组" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.stem !== undefined) data.stem = body.stem;
    if (body.type !== undefined) data.type = body.type;
    if (body.analysis !== undefined) data.analysis = body.analysis;
    if (body.orderIndex !== undefined) data.orderIndex = body.orderIndex;
    if (body.confidence !== undefined) data.confidence = body.confidence;
    if (body.options !== undefined) data.options = JSON.stringify(body.options);
    if (body.answer !== undefined) data.answer = JSON.stringify(body.answer);

    const updated = await prisma.question.update({ where: { id }, data });
    return NextResponse.json(updated);
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
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
