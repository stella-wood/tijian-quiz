"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Option, QuestionType } from "@/types";
import { TYPE_LABEL } from "@/types";

interface Question {
  id: string;
  type: QuestionType;
  stem: string;
  options: Option[];
  answer: string[];
  analysis: string | null;
}

interface SessionData {
  id: string;
  currentIndex: number;
  totalCount: number;
  correctCount: number;
  mode: string;
  finishedAt: string | null;
  currentQuestion: Question | null;
}


export default function PracticePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [fillText, setFillText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    standardAnswer: string[];
    analysis: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  async function fetchSession() {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data);
      setStartTime(Date.now());
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  function resetForNext() {
    setSelected([]);
    setFillText("");
    setSubmitted(false);
    setResult(null);
    setStartTime(Date.now());
  }

  const handleSelect = useCallback(
    (key: string) => {
      if (submitted || !session?.currentQuestion) return;
      const type = session.currentQuestion.type;
      if (type === "single_choice" || type === "true_false") {
        setSelected([key]);
      } else if (type === "multiple_choice") {
        setSelected((prev) =>
          prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
      }
    },
    [submitted, session?.currentQuestion]
  );

  async function handleSubmit() {
    if (!session?.currentQuestion) return;

    const type = session.currentQuestion.type;
    const userAnswer =
      type === "fill_blank" ? [fillText] : selected;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAnswer,
          durationMs: Date.now() - startTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({
        correct: data.isCorrect,
        standardAnswer: data.standardAnswer,
        analysis: data.analysis,
      });
      setSubmitted(true);
      // Update session progress
      setSession((prev) =>
        prev
          ? {
              ...prev,
              currentIndex: prev.currentIndex + 1,
              correctCount: data.isCorrect ? prev.correctCount + 1 : prev.correctCount,
              finishedAt: data.isLastQuestion ? new Date().toISOString() : null,
            }
          : prev
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (session?.finishedAt) {
      router.push(`/practice/report?sessionId=${sessionId}`);
    } else {
      fetchSession();
      resetForNext();
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  if (!session?.currentQuestion && !submitted) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">已完成或无法加载题目</p>
        <button
          onClick={() => router.push(`/practice/report?sessionId=${sessionId}`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          查看报告
        </button>
      </div>
    );
  }

  // At this point, session must be non-null because:
  // - loading=false means we've fetched
  // - the check above returns early if no currentQuestion AND not submitted
  if (!session) {
    return <div className="text-center py-20 text-gray-500">会话数据异常</div>;
  }

  const q = session.currentQuestion;
  const progress = Math.round((session.currentIndex / session.totalCount) * 100);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
          <span>
            {session.currentIndex + (submitted ? 1 : 0)} / {session.totalCount}
          </span>
          <span>
            {TYPE_LABEL[q?.type as QuestionType] ?? q?.type} · {session.mode === "sequential" ? "顺序" : session.mode === "random" ? "随机" : "错题"}
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {q && (
        <div className="bg-white rounded-lg border p-6">
          {/* Stem */}
          <div className="mb-6">
            <p className="text-lg text-gray-900 whitespace-pre-wrap leading-relaxed">
              {q.stem}
            </p>
          </div>

          {/* Options / Input */}
          {q.type !== "fill_blank" && q.options.length > 0 && (
            <div className="space-y-2 mb-6">
              {q.options.map((opt) => {
                let bgClass = "bg-gray-50 border-gray-200";
                if (submitted && result) {
                  if (result.standardAnswer.includes(opt.key) && result.correct) {
                    bgClass = "bg-green-50 border-green-300";
                  } else if (selected.includes(opt.key) && !result.correct) {
                    bgClass = "bg-red-50 border-red-300";
                  } else if (result.standardAnswer.includes(opt.key)) {
                    bgClass = "bg-green-50 border-green-300";
                  }
                } else if (selected.includes(opt.key)) {
                  bgClass = "bg-blue-50 border-blue-300";
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelect(opt.key)}
                    disabled={submitted}
                    className={`w-full text-left border rounded-lg px-4 py-3 transition-colors ${bgClass} ${
                      submitted ? "cursor-default" : "hover:border-blue-300"
                    }`}
                  >
                    <span className="font-medium text-gray-500 mr-2">
                      {opt.key}.
                    </span>
                    <span className="text-gray-800">{opt.content}</span>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "fill_blank" && (
            <div className="mb-6">
              <input
                type="text"
                value={fillText}
                onChange={(e) => setFillText(e.target.value)}
                disabled={submitted}
                placeholder="请输入答案"
                className={`w-full border rounded-lg px-4 py-3 text-lg ${
                  submitted
                    ? result?.correct
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                    : "border-gray-300"
                } disabled:cursor-default`}
              />
            </div>
          )}

          {/* Submit / Next */}
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || (q.type !== "fill_blank" && selected.length === 0)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "提交中..." : "提交答案"}
            </button>
          ) : (
            <div>
              {/* Result feedback */}
              <div
                className={`rounded-lg px-4 py-3 mb-4 ${
                  result?.correct
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <p className="font-medium">
                  {result?.correct ? "✓ 回答正确！" : "✗ 回答错误"}
                </p>
                {!result?.correct && result?.standardAnswer && (
                  <p className="text-sm mt-1">
                    正确答案：{result.standardAnswer.join("、")}
                  </p>
                )}
              </div>

              {/* Analysis */}
              {result?.analysis && (
                <div className="bg-blue-50 rounded-lg px-4 py-3 mb-4 text-sm text-blue-800">
                  <p className="font-medium mb-1">解析</p>
                  <p>{result.analysis}</p>
                </div>
              )}

              {/* Next button */}
              <button
                onClick={handleNext}
                className="w-full bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
              >
                {session.finishedAt ? "查看报告" : "下一题"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
