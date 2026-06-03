import { NextResponse } from "next/server";
import { parseText } from "@/lib/parser";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未找到文件" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    if (!filename.endsWith(".txt") && !filename.endsWith(".md")) {
      return NextResponse.json({ error: "仅支持 .txt 和 .md 文件格式" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "文件大小不能超过 5MB" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "文件内容为空" }, { status: 400 });
    }

    const raw = await file.text();

    if (!raw || raw.trim().length === 0) {
      return NextResponse.json({ error: "文件内容为空" }, { status: 400 });
    }

    const result = parseText(raw);

    return NextResponse.json({
      filename: file.name,
      questionCount: result.questions.length,
      ...result,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
