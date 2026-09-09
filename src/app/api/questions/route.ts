import { NextResponse } from "next/server";
import { CreateQuestionSchema } from "@/features/questions/contracts";
import { parseJson, routeError } from "@/server/http";
import { questionService } from "@/server/services";
import { toLegacyQuestion } from "@/server/repositories/prisma-repository";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, CreateQuestionSchema);
    const question = await questionService.create(input);
    return NextResponse.json(toLegacyQuestion(question), { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
