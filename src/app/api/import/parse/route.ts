import { NextResponse } from "next/server";
import { AppError } from "@/features/errors";
import { decodeQuestionFile } from "@/features/import/decode";
import { parseText } from "@/lib/parser";
import { routeError } from "@/server/http";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new AppError("未找到文件", "VALIDATION_ERROR", 400);
    }

    const filename = file.name.toLowerCase();
    if (!filename.endsWith(".txt") && !filename.endsWith(".md")) {
      throw new AppError("仅支持 .txt 和 .md 文件格式", "UNSUPPORTED_FILE", 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError("文件大小不能超过 5MB", "FILE_TOO_LARGE", 400);
    }
    if (file.size === 0) {
      throw new AppError("文件内容为空", "VALIDATION_ERROR", 400);
    }

    const raw = decodeQuestionFile(await file.arrayBuffer());
    if (!raw.trim()) {
      throw new AppError("文件内容为空", "VALIDATION_ERROR", 400);
    }
    const result = parseText(raw);
    return NextResponse.json({
      filename: file.name,
      questionCount: result.questions.length,
      ...result,
    });
  } catch (error) {
    return routeError(error);
  }
}
