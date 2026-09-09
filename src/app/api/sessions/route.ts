import { NextResponse } from "next/server";
import { CreateSessionSchema } from "@/features/practice/contracts";
import { parseJson, routeError } from "@/server/http";
import { practiceService } from "@/server/services";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, CreateSessionSchema);
    return NextResponse.json(await practiceService.createSession(input.bankId, input.mode), { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
