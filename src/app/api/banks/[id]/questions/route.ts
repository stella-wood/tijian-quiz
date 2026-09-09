import { NextResponse } from "next/server";
import { BankIdSchema } from "@/features/banks/contracts";
import { parseWithSchema, routeError } from "@/server/http";
import { questionService } from "@/server/services";
import { toLegacyQuestion } from "@/server/repositories/prisma-repository";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseWithSchema(BankIdSchema, (await params).id);
    const questions = await questionService.listByBank(id);
    return NextResponse.json(questions.map(toLegacyQuestion));
  } catch (error) {
    return routeError(error);
  }
}
