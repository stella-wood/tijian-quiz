"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { importBackup } from "./client";

export function BackupActions() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await importBackup(file);
      const inserted = Object.values(result.inserted).reduce((sum, value) => sum + value, 0);
      const skipped = Object.values(result.skipped).reduce((sum, value) => sum + value, 0);
      setMessage(`恢复完成：新增 ${inserted} 条，跳过 ${skipped} 条相同数据。`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "恢复失败");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mb-6 rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">数据备份</p>
          <p className="mt-0.5 text-xs text-gray-500">导出或合并恢复全部题库与练习记录</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/backup/export" download className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            导出备份
          </a>
          <button disabled={busy} onClick={() => inputRef.current?.click()} className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {busy ? "恢复中..." : "恢复备份"}
          </button>
          <input ref={inputRef} className="hidden" type="file" accept="application/json,.json" onChange={(event) => void handleFile(event.target.files?.[0])} />
        </div>
      </div>
      {message && <p role="status" className="mt-3 text-sm text-green-700">{message}</p>}
      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
    </div>
  );
}
