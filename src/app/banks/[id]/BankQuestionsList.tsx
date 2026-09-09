"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { QuestionEditor } from "@/features/questions/QuestionEditor";
import { deleteQuestion, updateQuestion } from "@/features/questions/client";
import type { QuestionDto } from "@/features/questions/contracts";
import { TYPE_LABEL } from "@/features/questions/contracts";

export function BankQuestionsList({ questions }: { questions: QuestionDto[] }) {
  const [items, setItems] = useState(questions);
  const [visibleAnswers, setVisibleAnswers] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<QuestionDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestionDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleAnswer(id: string) {
    setVisibleAnswers((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setVisibleAnswers((previous) =>
      previous.size === items.length ? new Set() : new Set(items.map((item) => item.id))
    );
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      const updated = await updateQuestion(editing.id, {
        type: editing.type,
        stem: editing.stem,
        options: editing.options,
        answer: editing.answer,
        analysis: editing.analysis,
        orderIndex: editing.orderIndex,
        confidence: editing.confidence,
      });
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存题目失败");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setError("");
    try {
      await deleteQuestion(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "删除题目失败");
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">当前显示 {items.length} 道题</span>
        <button onClick={toggleAll} className="text-sm text-gray-500 hover:text-gray-700">
          {visibleAnswers.size === items.length ? "隐藏全部答案" : "显示全部答案"}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((question) => {
          const revealed = visibleAnswers.has(question.id);
          return (
            <article key={question.id} className="rounded-lg border bg-white p-4">
              {editing?.id === question.id ? (
                <QuestionEditor value={editing} busy={busy} onChange={setEditing} onSave={() => void saveEdit()} onCancel={() => setEditing(null)} />
              ) : (
                <div className="flex items-start gap-3">
                  <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{question.orderIndex}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">{TYPE_LABEL[question.type]}</span>
                      <button onClick={() => setEditing(structuredClone(question))} className="ml-auto text-xs text-blue-600">编辑</button>
                      <button onClick={() => setDeleteTarget(question)} className="text-xs text-red-500">删除</button>
                    </div>
                    <p className="whitespace-pre-wrap text-gray-900">{question.stem}</p>
                    {question.options.length > 0 && (
                      <div className="mt-2 space-y-0.5 text-sm text-gray-600">
                        {question.options.map((option) => (
                          <div key={option.key} className={revealed && question.answer.includes(option.key) ? "font-medium text-green-700" : ""}>
                            {option.key}. {option.content}
                          </div>
                        ))}
                      </div>
                    )}
                    {revealed && <div className="mt-2 border-t pt-2 text-xs text-gray-500">答案：{question.answer.join("、")}{question.analysis && ` · 解析：${question.analysis}`}</div>}
                    <button onClick={() => toggleAnswer(question.id)} className="mt-2 text-xs text-blue-500">{revealed ? "隐藏答案" : "查看答案"}</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除这道题？"
        description="若题目已有练习记录，系统会拒绝单独删除以保护历史报告；此时可删除整个题库。"
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
