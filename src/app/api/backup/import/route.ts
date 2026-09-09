import { NextResponse } from "next/server";
import { AppError } from "@/features/errors";
import { BackupManifestV1Schema } from "@/features/backup/contracts";
import { routeError } from "@/server/http";
import { backupService } from "@/server/services";

const MAX_BACKUP_SIZE = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new AppError("未找到备份文件", "VALIDATION_ERROR", 400);
    }
    if (!file.name.toLowerCase().endsWith(".json")) {
      throw new AppError("备份文件必须是 JSON 格式", "UNSUPPORTED_FILE", 400);
    }
    if (file.size === 0 || file.size > MAX_BACKUP_SIZE) {
      throw new AppError("备份文件必须小于 20MB 且不能为空", "FILE_TOO_LARGE", 400);
    }

    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      throw new AppError("备份文件不是有效的 JSON", "VALIDATION_ERROR", 400);
    }
    const manifest = BackupManifestV1Schema.parse(json);
    return NextResponse.json(await backupService.importManifest(manifest));
  } catch (error) {
    return routeError(error);
  }
}
