import { NextResponse } from "next/server";
import { z } from "zod";
import { SubmitAnswerSchema } from "@/features/practice/contracts";
import { parseJson, parseWithSchema, routeError } from "@/server/http";
import { practiceService } from "@/server/services";

const SessionIdSchema = z.string().uuid("练习会话 ID 格式无效");

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseWithSchema(SessionIdSchema, (await params).id);
    const input = await parseJson(request, SubmitAnswerSchema);
    return NextResponse.json(await practiceService.submitAnswer(id, input));
  } catch (error) {
    return routeError(error);
  }
}
