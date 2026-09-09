import { NextResponse } from "next/server";
import { CreateBankSchema } from "@/features/banks/contracts";
import { parseJson, routeError } from "@/server/http";
import { bankService } from "@/server/services";

export async function GET() {
  try {
    return NextResponse.json(await bankService.list());
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, CreateBankSchema);
    return NextResponse.json(await bankService.create(input), { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
