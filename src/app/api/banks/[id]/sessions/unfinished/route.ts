import { NextResponse } from "next/server";
import { BankIdSchema } from "@/features/banks/contracts";
import { parseWithSchema, routeError } from "@/server/http";
import { practiceService } from "@/server/services";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseWithSchema(BankIdSchema, (await params).id);
    return NextResponse.json(await practiceService.getUnfinished(id));
  } catch (error) {
    return routeError(error);
  }
}
