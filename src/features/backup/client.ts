import { requestJson } from "@/features/http-client";
import type { BackupImportStats } from "./contracts";

export function importBackup(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestJson<BackupImportStats>("/api/backup/import", {
    method: "POST",
    body: formData,
  });
}
