"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BankActions({
  bankId,
  questionCount,
}: {
  bankId: string;
  questionCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function startPractice(mode: string) {
    setLoading(mode);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankId, mode }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "创建练习失败");
        return;
      }
      const session = await res.json();
      router.push(`/practice/${session.id}`);
    } finally {
      setLoading(null);
    }
  }

  const buttons = [
    { mode: "sequential", label: "顺序练习", desc: "按题目顺序依次作答" },
    { mode: "random", label: "随机练习", desc: "乱序抽取题目" },
    { mode: "wrong", label: "错题重练", desc: "只练错过的题目" },
  ];

  if (questionCount === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">导入题目后即可开始练习</p>
    );
  }

  return (
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
  );
}
