import { NextResponse } from "next/server";
import { z } from "zod";
import { parseWithSchema, routeError } from "@/server/http";
import { practiceService } from "@/server/services";

const SessionIdSchema = z.string().uuid("练习会话 ID 格式无效");

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseWithSchema(SessionIdSchema, (await params).id);
    return NextResponse.json(await practiceService.getSession(id));
  } catch (error) {
    return routeError(error);
  }
}
