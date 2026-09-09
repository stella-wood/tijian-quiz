import { NextResponse } from "next/server";
import { BankIdSchema } from "@/features/banks/contracts";
import { parseWithSchema, routeError } from "@/server/http";
import { practiceService } from "@/server/services";

export async function GET(request: Request) {
  try {
    const value = new URL(request.url).searchParams.get("bankId");
    const bankId = value ? parseWithSchema(BankIdSchema, value) : undefined;
    return NextResponse.json(await practiceService.listWrong(bankId));
  } catch (error) {
    return routeError(error);
  }
}
