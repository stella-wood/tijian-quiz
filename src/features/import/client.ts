import { requestJson } from "@/features/http-client";
import type { ParseResult } from "@/types";
import type { ImportCommitRequest, ImportCommitResponse } from "./contracts";

export interface ParseFileResponse extends ParseResult {
  filename: string;
  questionCount: number;
}

export function parseQuestionFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestJson<ParseFileResponse>("/api/import/parse", {
    method: "POST",
    body: formData,
  });
}

export function commitImport(input: ImportCommitRequest) {
  return requestJson<ImportCommitResponse>("/api/import/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
