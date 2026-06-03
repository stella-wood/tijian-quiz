"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { QuestionType } from "@/types";
import { TYPE_LABEL } from "@/types";
import { safeJsonParse } from "@/lib/safe-json";

interface WrongQuestionData {
  id: string;
  questionId: string;
  wrongCount: number;
  lastWrongAt: string;
  question: {
    id: string;
    bankId: string;
    type: QuestionType;
    stem: string;
    options: string;
    answer: string;
    analysis: string | null;
    bank: { id: string; title: string };
  };
}

export default function WrongQuestionsPage() {
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wrong-questions")
      .then((res) => res.json())
      .then((data) => setWrongQuestions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">错题本</h1>

      {wrongQuestions.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">还没有错题</p>
          <p className="text-sm">继续练习，做错的题目会自动记录在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wrongQuestions.map((wq) => {
            const options = safeJsonParse<{ key: string; content: string }[]>(wq.question.options, []);
            const answer = safeJsonParse<string[]>(wq.question.answer, []);
            return (
              <div key={wq.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        wq.wrongCount >= 3
                          ? "bg-red-50 text-red-600"
                          : "bg-yellow-50 text-yellow-600"
                      }`}
                    >
                      错{wq.wrongCount}次
                    </span>
                    <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {TYPE_LABEL[wq.question.type] ?? wq.question.type}
                    </span>
                    <Link
                      href={`/banks/${wq.question.bankId}`}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      {wq.question.bank.title}
                    </Link>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(wq.lastWrongAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="text-gray-900 whitespace-pre-wrap mb-2">{wq.question.stem}</p>
                {options.length > 0 && (
                  <div className="text-sm text-gray-600 mb-1">
                    {options.map((opt) => (
                      <span
                        key={opt.key}
                        className={
                          answer.includes(opt.key)
                            ? "text-green-700 font-medium mr-3"
                            : "mr-3"
                        }
                      >
                        {opt.key}. {opt.content}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  正确答案：{answer.join("、")}
                  {wq.question.analysis && ` · ${wq.question.analysis}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
