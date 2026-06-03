"use client";

import { useState } from "react";
import { TYPE_LABEL } from "@/types";
import { safeJsonParse } from "@/lib/safe-json";
import type { QuestionType } from "@/types";

interface QuestionItem {
  id: string;
  type: string;
  stem: string;
  options: string;
  answer: string;
  analysis: string | null;
  orderIndex: number;
}

export function BankQuestionsList({ questions }: { questions: QuestionItem[] }) {
  const [visibleAnswers, setVisibleAnswers] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState<boolean | null>(null);

  function toggleQuestion(id: string) {
    setVisibleAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setShowAll(null);
  }

  function toggleAll() {
    if (showAll === true) {
      setShowAll(false);
      setVisibleAnswers(new Set());
    } else {
      setShowAll(true);
      setVisibleAnswers(new Set(questions.map((q) => q.id)));
    }
  }

  function isVisible(id: string): boolean {
    return showAll ?? visibleAnswers.has(id);
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={toggleAll}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showAll === true ? "隐藏全部答案" : "显示全部答案"}
        </button>
      </div>

      <div className="space-y-3">
        {questions.map((q) => {
          const options = safeJsonParse<{ key: string; content: string }[]>(q.options, []);
          const answer = safeJsonParse<string[]>(q.answer, []);
          const revealed = isVisible(q.id);

          return (
            <div key={q.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">
                  {q.orderIndex}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {TYPE_LABEL[q.type as QuestionType] ?? q.type}
                    </span>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{q.stem}</p>

                  {options.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                      {options.map((opt) => (
                        <div
                          key={opt.key}
                          className={
                            revealed && answer.includes(opt.key)
                              ? "text-green-700 font-medium"
                              : ""
                          }
                        >
                          {opt.key}. {opt.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {revealed && (
                    <div className="mt-2 pt-2 border-t text-xs text-gray-400">
                      答案：{answer.join("、")}
                      {q.analysis && ` · 解析：${q.analysis}`}
                    </div>
                  )}

                  <button
                    onClick={() => toggleQuestion(q.id)}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-700"
                  >
                    {revealed ? "隐藏答案" : "查看答案"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
