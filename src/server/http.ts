import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AppError, type ApiError } from "@/features/errors";

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new AppError("请求内容不是有效的 JSON", "VALIDATION_ERROR", 400);
  }
  return schema.parse(json);
}

export function parseWithSchema<T>(schema: ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

export function routeError(error: unknown) {
  if (error instanceof ZodError) {
    const body: ApiError = {
      error: error.issues[0]?.message ?? "请求参数无效",
      code: "VALIDATION_ERROR",
      details: error.flatten(),
    };
    return NextResponse.json(body, { status: 400 });
  }
  if (error instanceof AppError) {
    const body: ApiError = {
      error: error.message,
      code: error.code,
      ...(error.details === undefined ? {} : { details: error.details }),
    };
    return NextResponse.json(body, { status: error.status });
  }
  console.error(error);
  const body: ApiError = { error: "服务器内部错误", code: "INTERNAL_ERROR" };
  return NextResponse.json(body, { status: 500 });
}
