"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSession, getUnfinishedSessions } from "@/features/practice/client";
import type { PracticeMode, UnfinishedSessionDto } from "@/features/practice/contracts";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export function BankActions({
  bankId,
  questionCount,
}: {
  bankId: string;
  questionCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [unfinished, setUnfinished] = useState<UnfinishedSessionDto | null>(null);
  const [checking, setChecking] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getUnfinishedSessions(bankId)
      .then((data) => {
        if (data.length > 0) {
          setUnfinished(data[0]);
        }
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "检查练习进度失败"))
      .finally(() => setChecking(false));
  }, [bankId]);

  async function startPractice(mode: PracticeMode) {
    setLoading(mode);
    try {
      setError("");
      const session = await createSession(bankId, mode);
      router.push(`/practice/${session.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "创建练习失败");
    } finally {
      setLoading(null);
    }
  }

  if (questionCount === 0) {
    return <p className="text-sm text-gray-400 py-4">导入题目后即可开始练习</p>;
  }

  if (checking) {
    return <p className="text-sm text-gray-400 py-4">检查中...</p>;
  }

  if (unfinished && !dismissed) {
    const modeLabel: Record<string, string> = {
      sequential: "顺序练习",
      random: "随机练习",
      wrong: "错题重练",
    };
    const progress = Math.round(
      (unfinished.currentIndex / unfinished.totalCount) * 100
    );
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="font-medium text-sm text-amber-900 mb-1">
          检测到未完成的练习
        </p>
        <p className="text-sm text-amber-700 mb-3">
          {modeLabel[unfinished.mode] ?? unfinished.mode}
          {" · "}进度：{unfinished.currentIndex}/{unfinished.totalCount} ({progress}%)
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/practice/${unfinished.id}`)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 transition-colors"
          >
            继续练习
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            重新开始
          </button>
        </div>
      </div>
    );
  }

  const buttons: { mode: PracticeMode; label: string; desc: string }[] = [
    { mode: "sequential", label: "顺序练习", desc: "按题目顺序依次作答" },
    { mode: "random", label: "随机练习", desc: "乱序抽取题目" },
    { mode: "wrong", label: "错题重练", desc: "只练错过的题目" },
  ];

  return (
    <div>
      {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
      <div className="flex flex-wrap gap-3">
      {buttons.map((btn) => (
        <button
          key={btn.mode}
          onClick={() => startPractice(btn.mode)}
          disabled={loading !== null}
          className="bg-white border rounded-lg px-4 py-3 text-left hover:border-blue-300 hover:shadow-sm disabled:opacity-50 transition-all min-w-[160px]"
        >
          <div className="font-medium text-sm text-gray-900">
            {loading === btn.mode ? "创建中..." : btn.label}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{btn.desc}</div>
        </button>
      ))}
      </div>
    </div>
  );
}
