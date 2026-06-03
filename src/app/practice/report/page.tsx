"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface AnswerRecord {
  id: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  durationMs: number;
  answeredAt: string;
}

interface SessionReport {
  id: string;
  bankId: string;
  mode: string;
  totalCount: number;
  correctCount: number;
  currentIndex: number;
  startedAt: string;
  finishedAt: string;
  bank: { title: string };
  answers: AnswerRecord[];
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [report, setReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setReport(data);
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  if (!report) {
    return null;
  }

  const accuracy =
    report.totalCount > 0
      ? Math.round((report.correctCount / report.totalCount) * 100)
      : 0;

  const answeredCount = report.answers.length;
  const totalDurationMs = report.answers.reduce(
    (sum, a) => sum + a.durationMs,
    0
  );

  const modeLabel: Record<string, string> = {
    sequential: "顺序练习",
    random: "随机练习",
    wrong: "错题重练",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6">练习报告</h1>

      {/* Summary */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-medium text-gray-900 mb-1">{report.bank.title}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {modeLabel[report.mode] ?? report.mode}
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {report.correctCount}/{report.totalCount}
            </div>
            <div className="text-sm text-blue-500 mt-1">正确率 {accuracy}%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">
              {answeredCount}
            </div>
            <div className="text-sm text-gray-500 mt-1">已作答</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">
              {(totalDurationMs / 1000).toFixed(0)}s
            </div>
            <div className="text-sm text-gray-500 mt-1">总用时</div>
          </div>
        </div>
      </div>

      {/* Answer list */}
      {report.answers.length > 0 && (
        <div className="bg-white rounded-lg border mb-6">
          <div className="px-4 py-3 border-b font-medium text-sm text-gray-700">
            作答详情
          </div>
          <div className="divide-y">
            {report.answers.map((ans, i) => (
              <div key={ans.id} className="px-4 py-3 flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    ans.isCorrect
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {ans.isCorrect ? "✓" : "✗"}
                </span>
                <span className="text-sm text-gray-500">第 {i + 1} 题</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {(ans.durationMs / 1000).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/banks/${report.bankId}`}
          className="flex-1 text-center bg-white border rounded-lg py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          返回题库
        </Link>
        <Link
          href="/"
          className="flex-1 text-center bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={<div className="text-center py-20 text-gray-500">加载中...</div>}
    >
      <ReportContent />
    </Suspense>
  );
}
