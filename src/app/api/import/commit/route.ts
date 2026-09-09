import { NextResponse } from "next/server";
import { ImportCommitSchema } from "@/features/import/contracts";
import { parseJson, routeError } from "@/server/http";
import { importService } from "@/server/services";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, ImportCommitSchema);
    return NextResponse.json(await importService.commit(input), { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
