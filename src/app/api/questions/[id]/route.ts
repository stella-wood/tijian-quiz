import { NextResponse } from "next/server";
import { z } from "zod";
import { UpdateQuestionSchema } from "@/features/questions/contracts";
import { parseJson, parseWithSchema, routeError } from "@/server/http";
import { questionService } from "@/server/services";
import { toLegacyQuestion } from "@/server/repositories/prisma-repository";

const QuestionIdSchema = z.string().uuid("题目 ID 格式无效");

async function getId(params: Promise<{ id: string }>) {
  return parseWithSchema(QuestionIdSchema, (await params).id);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(toLegacyQuestion(await questionService.get(await getId(params))));
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = await parseJson(request, UpdateQuestionSchema);
    return NextResponse.json(
      toLegacyQuestion(await questionService.update(await getId(params), input))
    );
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await questionService.delete(await getId(params)));
  } catch (error) {
    return routeError(error);
  }
}
