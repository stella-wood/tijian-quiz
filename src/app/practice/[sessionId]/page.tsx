"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { Option, QuestionType } from "@/types";
import { TYPE_LABEL } from "@/types";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { getSession, submitAnswer } from "@/features/practice/client";

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
  bankId: string;
  currentIndex: number;
  totalCount: number;
  correctCount: number;
  mode: string;
  finishedAt: string | null;
  questionIds: string;
  currentQuestion: Question | null;
}

interface HistoryEntry {
  question: Question;
  userAnswer: string[];
  result: {
    correct: boolean;
    standardAnswer: string[];
    analysis: string | null;
  };
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
  const [startTime, setStartTime] = useState(0);
  const [answeredHistory, setAnsweredHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [loadError, setLoadError] = useState("");
  const submittedRef = useRef(false);

  const fetchSession = useCallback(async () => {
    try {
      setLoadError("");
      const data = await getSession(sessionId);
      if (data.status === "completed" && !submittedRef.current) {
        router.replace(`/practice/report?sessionId=${sessionId}`);
        return;
      }
      setSession(data);
      setStartTime(Date.now());

      // Rebuild answeredHistory from existing answers
      if (data.answers && Array.isArray(data.answers)) {
        const history: HistoryEntry[] = data.answers.map((answer) => {
          return {
            question: answer.question,
            userAnswer: answer.userAnswer,
            result: {
              correct: answer.isCorrect,
              standardAnswer: answer.question.answer,
              analysis: answer.question.analysis,
            },
          };
        });
        setAnsweredHistory(history);
        setHistoryIndex(null);
      }
    } catch (e) {
      console.error("获取会话失败:", e);
      setLoadError(e instanceof Error ? e.message : "获取会话失败");
    } finally {
      setLoading(false);
    }
  }, [router, sessionId]);

  useEffect(() => {
    void Promise.resolve().then(fetchSession);
  }, [fetchSession]);

  function resetForNext() {
    submittedRef.current = false;
    setSelected([]);
    setFillText("");
    setSubmitted(false);
    setResult(null);
    setStartTime(Date.now());
  }

  function handleSelect(key: string) {
      if (submitted || !session?.currentQuestion) return;
      const type = session.currentQuestion.type;
      if (type === "single_choice" || type === "true_false") {
        setSelected([key]);
      } else if (type === "multiple_choice") {
        setSelected((prev) =>
          prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
      }
  }

  async function handleSubmit() {
    if (!session?.currentQuestion) return;

    const type = session.currentQuestion.type;
    const userAnswer =
      type === "fill_blank" ? [fillText] : selected;

    setSubmitting(true);
    try {
      const data = await submitAnswer(sessionId, userAnswer, Date.now() - startTime);
      setResult({
        correct: data.isCorrect,
        standardAnswer: data.standardAnswer,
        analysis: data.analysis,
      });
      submittedRef.current = true;
      setSubmitted(true);

      if (session?.currentQuestion) {
        setAnsweredHistory((prev) => [
          ...prev,
          {
            question: session.currentQuestion!,
            userAnswer,
            result: {
              correct: data.isCorrect,
              standardAnswer: data.standardAnswer,
              analysis: data.analysis,
            },
          },
        ]);
        setHistoryIndex(null);
      }

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

  function goToPrevious() {
    if (answeredHistory.length === 0) return;
    if (historyIndex === null) {
      setHistoryIndex(answeredHistory.length - 1);
    } else if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }

  function goToNextHistory() {
    setHistoryIndex((prev) => {
      if (prev === null) return null;
      if (prev < answeredHistory.length - 1) return prev + 1;
      return null; // at last answered question → go back to current
    });
  }

  function goToCurrent() {
    setHistoryIndex(null);
  }

  function jumpToQuestion(index: number) {
    if (index < 0 || index >= answeredHistory.length) return;
    setHistoryIndex(index);
    setShowQuestionList(false);
  }

  async function handleNext() {
    if (session?.finishedAt) {
      router.push(`/practice/report?sessionId=${sessionId}`);
    } else {
      await fetchSession();
      resetForNext();
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  if (loadError) {
    return <div className="mx-auto max-w-2xl py-10"><ErrorBanner message={loadError} /></div>;
  }

  if (!session?.currentQuestion && !submitted && answeredHistory.length === 0) {
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

  if (!session) {
    return <div className="text-center py-20 text-gray-500">会话数据异常</div>;
  }

  const effectiveEntry = historyIndex !== null ? answeredHistory[historyIndex] : null;
  const effectiveQuestion = effectiveEntry?.question ?? session.currentQuestion;
  const effectiveSubmitted = effectiveEntry ? true : submitted;
  const effectiveResult = effectiveEntry?.result ?? result;
  const effectiveSelected = effectiveEntry?.userAnswer ?? selected;

  // Progress: reflects the question currently being viewed (1-based)
  const viewingNumber = historyIndex !== null
    ? historyIndex + 1
    : session.currentIndex + (submitted ? 0 : 1);
  const displayProgress = Math.round((viewingNumber / session.totalCount) * 100);

  // Build question status list for the popup
  function getQuestionStatus(i: number): "current" | "correct" | "wrong" | "unanswered" {
    // Determine which question index is currently being viewed
    let currentViewingIndex: number | null;
    if (historyIndex !== null) {
      currentViewingIndex = historyIndex;
    } else {
      // viewingNumber - 1 gives 0-based index
      currentViewingIndex = viewingNumber - 1;
    }

    if (i === currentViewingIndex) return "current";
    if (i < answeredHistory.length) {
      return answeredHistory[i].result.correct ? "correct" : "wrong";
    }
    return "unanswered";
  }

  const statusDots: Record<string, { bg: string; label: string }> = {
    current: { bg: "bg-blue-500 text-white", label: "当前" },
    correct: { bg: "bg-green-100 text-green-700", label: "✓" },
    wrong: { bg: "bg-red-100 text-red-700", label: "✗" },
    unanswered: { bg: "bg-gray-100 text-gray-500", label: "○" },
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar: back link + question list button */}
      <div className="flex items-center justify-between mb-4">
        {session.bankId ? (
          <Link
            href={`/banks/${session.bankId}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回题库
          </Link>
        ) : (
          <div />
        )}
        <button
          onClick={() => setShowQuestionList(true)}
          className="text-sm text-gray-500 hover:text-gray-700 border rounded-lg px-3 py-1"
        >
          题目列表
        </button>
      </div>

      {/* Question list modal */}
      {showQuestionList && (
        <div className="fixed inset-0 z-20 flex items-start justify-center pt-20">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowQuestionList(false)} />
          <div className="relative bg-white rounded-lg border shadow-lg p-6 w-80 max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">题目列表</h3>
              <div>
                {historyIndex !== null && (
                  <button
                    onClick={() => { goToCurrent(); setShowQuestionList(false); }}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    ← 返回当前题
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: session.totalCount }, (_, i) => {
                const status = getQuestionStatus(i);
                const dot = statusDots[status];
                const isClickable = i < answeredHistory.length;
                return (
                  <button
                    key={i}
                    onClick={() => isClickable && jumpToQuestion(i)}
                    disabled={!isClickable}
                    className={`w-10 h-10 rounded-lg text-xs font-medium ${dot.bg} ${isClickable ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
                    title={isClickable ? `跳转到第 ${i + 1} 题` : "尚未作答"}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> 正确</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> 错误</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" /> 未答</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> 当前</span>
            </div>
            <button
              onClick={() => setShowQuestionList(false)}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 border rounded-lg py-2"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
          <span>{viewingNumber} / {session.totalCount}</span>
          <span>
            {TYPE_LABEL[effectiveQuestion?.type as QuestionType] ?? (effectiveQuestion?.type ?? "")}
            {" · "}
            {session.mode === "sequential" ? "顺序" : session.mode === "random" ? "随机" : "错题"}
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      {effectiveQuestion && (
        <div className="bg-white rounded-lg border p-6">
          {/* Stem */}
          <div className="mb-6">
            <p className="text-lg text-gray-900 whitespace-pre-wrap leading-relaxed">
              <span className="font-medium text-gray-500">{viewingNumber}. </span>
              {effectiveQuestion.stem}
            </p>
          </div>

          {/* Options / Input */}
          {effectiveQuestion.type !== "fill_blank" && effectiveQuestion.options.length > 0 && (
            <div className="space-y-2 mb-6">
              {effectiveQuestion.options.map((opt) => {
                let bgClass = "bg-gray-50 border-gray-200";
                if (effectiveSubmitted && effectiveResult) {
                  if (effectiveResult.standardAnswer.includes(opt.key) && effectiveResult.correct) {
                    bgClass = "bg-green-50 border-green-300";
                  } else if (effectiveSelected.includes(opt.key) && !effectiveResult.correct) {
                    bgClass = "bg-red-50 border-red-300";
                  } else if (effectiveResult.standardAnswer.includes(opt.key)) {
                    bgClass = "bg-green-50 border-green-300";
                  }
                } else if (effectiveSelected.includes(opt.key)) {
                  bgClass = "bg-blue-50 border-blue-300";
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelect(opt.key)}
                    disabled={effectiveSubmitted}
                    className={`w-full text-left border rounded-lg px-4 py-3 transition-colors ${bgClass} ${
                      effectiveSubmitted ? "cursor-default" : "hover:border-blue-300"
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

          {effectiveQuestion.type === "fill_blank" && (
            <div className="mb-6">
              <input
                type="text"
                value={effectiveEntry ? effectiveSelected.join("、") : fillText}
                onChange={(e) => setFillText(e.target.value)}
                disabled={effectiveSubmitted}
                placeholder="请输入答案"
                className={`w-full border rounded-lg px-4 py-3 text-lg ${
                  effectiveSubmitted
                    ? effectiveResult?.correct
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                    : "border-gray-300"
                } disabled:cursor-default`}
              />
            </div>
          )}

          {/* Submit */}
          {!effectiveSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || (effectiveQuestion.type !== "fill_blank" && selected.length === 0)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "提交中..." : "提交答案"}
            </button>
          ) : (
            <div>
              {/* Buttons: 上一题 + 下一题 (always show both) */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={goToPrevious}
                  className="bg-gray-100 border border-gray-200 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  style={{ width: "30%" }}
                >
                  &gt; 上一题
                </button>
                <button
                  onClick={historyIndex !== null ? goToNextHistory : handleNext}
                  className="bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
                  style={{ width: "70%" }}
                >
                  {historyIndex !== null
                    ? "下一题"
                    : session.finishedAt
                      ? "查看报告"
                      : "下一题"}
                </button>
              </div>

              {/* Result feedback */}
              <div
                className={`rounded-lg px-4 py-3 mb-4 ${
                  effectiveResult?.correct
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <p className="font-medium">
                  {effectiveResult?.correct ? "✓ 回答正确！" : "✗ 回答错误"}
                </p>
                {!effectiveResult?.correct && effectiveResult?.standardAnswer && (
                  <p className="text-sm mt-1">
                    正确答案：{effectiveResult.standardAnswer.join("、")}
                  </p>
                )}
              </div>

              {/* Analysis */}
              {effectiveResult?.analysis && (
                <div className="bg-blue-50 rounded-lg px-4 py-3 mb-4 text-sm text-blue-800">
                  <p className="font-medium mb-1">解析</p>
                  <p>{effectiveResult.analysis}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
