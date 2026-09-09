"use client";

import { useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { BankSummaryDto } from "./contracts";
import { deleteBank } from "./client";

export function BankList({ initialBanks }: { initialBanks: BankSummaryDto[] }) {
  const [banks, setBanks] = useState(initialBanks);
  const [target, setTarget] = useState<BankSummaryDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelete() {
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      await deleteBank(target.id);
      setBanks((items) => items.filter((item) => item.id !== target.id));
      setTarget(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "删除题库失败");
    } finally {
      setBusy(false);
    }
  }

  if (banks.length === 0) {
    return <EmptyState title="还没有题库" description="点击“导入题库”上传文档开始使用" />;
  }

  return (
    <>
      {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
      <div className="grid gap-3">
        {banks.map((bank) => (
          <div key={bank.id} className="flex items-center gap-2 rounded-lg border bg-white p-4 hover:shadow-md">
            <Link href={`/banks/${bank.id}`} className="min-w-0 flex-1">
              <h2 className="truncate font-medium text-gray-900">{bank.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{bank._count.questions} 道题目 · {new Date(bank.createdAt).toLocaleDateString("zh-CN")}</p>
            </Link>
            <button onClick={() => setTarget(bank)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">删除</button>
            <span className="text-lg text-gray-400">→</span>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={target !== null}
        title="删除整个题库？"
        description={`“${target?.title ?? ""}”及其 ${target?._count.questions ?? 0} 道题、练习记录和错题状态将永久删除。`}
        busy={busy}
        onCancel={() => setTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
