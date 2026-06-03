"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParsedQuestion, QuestionType } from "@/types";

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [filename, setFilename] = useState("");
  const [bankTitle, setBankTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  function toggleSelect(orderIndex: number) {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(orderIndex)) next.delete(orderIndex);
      else next.add(orderIndex);
      return next;
    });
  }

  function selectLowConfidence() {
    const lowSet = new Set<number>();
    questions.forEach((q) => {
      if (q.confidence < 0.4) lowSet.add(q.orderIndex);
    });
    setSelectedIndices(lowSet);
  }

  function batchDelete() {
    setQuestions((prev) => prev.filter((q) => !selectedIndices.has(q.orderIndex)));
    setSelectedIndices(new Set());
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    setError("");
    setParseErrors([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "解析失败");
      setQuestions(data.questions);
      setParseErrors(data.parseErrors || []);
      setFilename(data.filename);
      setBankTitle(data.filename.replace(/\.(txt|md)$/i, ""));
    } catch (e) {
      if (e instanceof TypeError && e.message === "Failed to fetch") {
        setError("无法连接到服务器，请确保已运行 start.bat 启动了服务");
      } else {
        setError(e instanceof Error ? e.message : "解析失败");
      }
    } finally {
      setParsing(false);
    }
  }

  function updateQuestion(index: number, field: keyof ParsedQuestion, value: unknown) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function addOption(index: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        if (q.options.length >= 5) return q;
        const nextKey = String.fromCharCode(65 + q.options.length);
        return { ...q, options: [...q.options, { key: nextKey, content: "" }] };
      })
    );
  }

  function removeOption(index: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        if (q.options.length <= 2) return q;
        return { ...q, options: q.options.slice(0, -1) };
      })
    );
  }

  async function handleSave() {
    if (!bankTitle.trim()) {
      setError("请输入题库名称");
      return;
    }
    if (questions.length === 0) {
      setError("没有可导入的题目");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Create bank
      const bankRes = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bankTitle.trim() }),
      });
      if (!bankRes.ok) throw new Error("创建题库失败");
      const bank = await bankRes.json();

      // Create questions
      for (const q of questions) {
        const qRes = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankId: bank.id,
            type: q.type,
            stem: q.stem,
            options: q.options,
            answer: q.answer,
            analysis: q.analysis,
            orderIndex: q.orderIndex,
            rawText: q.rawText,
            confidence: q.confidence,
          }),
        });
        if (!qRes.ok) {
          const errData = await qRes.json();
          throw new Error(errData.error || "创建题目失败");
        }
      }
      router.push(`/banks/${bank.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.7) return "text-green-600 bg-green-50";
    if (confidence >= 0.4) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  }

  function getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.7) return "高";
    if (confidence >= 0.4) return "中";
    return "低";
  }

  const typeOptions: { value: QuestionType; label: string }[] = [
    { value: "single_choice", label: "单选题" },
    { value: "multiple_choice", label: "多选题" },
    { value: "true_false", label: "判断题" },
    { value: "fill_blank", label: "填空题" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">导入题库</h1>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: File Upload */}
      {questions.length === 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择题库文档（.txt 或 .md）
            </label>
            <input
              type="file"
              accept=".txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            onClick={handleParse}
            disabled={!file || parsing}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {parsing ? "解析中..." : "开始解析"}
          </button>
          <p className="text-xs text-gray-400 mt-3">
            支持格式：题目编号 + 选项（A. B. C. D.）+ 答案 + 解析
          </p>
        </div>
      )}

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          <p className="font-medium mb-1">解析警告：</p>
          {parseErrors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {/* Step 2: Preview & Edit */}
      {questions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                题库名称
              </label>
              <input
                value={bankTitle}
                onChange={(e) => setBankTitle(e.target.value)}
                className="ml-2 border rounded-lg px-3 py-1 text-sm"
                placeholder="输入题库名称"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                共 {questions.length} 道题目
              </span>
              <button
                onClick={selectLowConfidence}
                className="text-sm text-orange-500 hover:text-orange-700"
              >
                选中低置信度
              </button>
              {selectedIndices.size > 0 && (
                <button
                  onClick={batchDelete}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  批量删除 ({selectedIndices.size})
                </button>
              )}
              <button
                onClick={() => {
                  setQuestions([]);
                  setParseErrors([]);
                  setFile(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                重新选择
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "保存中..." : "确认导入"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIndices.has(q.orderIndex)}
                      onChange={() => toggleSelect(q.orderIndex)}
                      className="w-4 h-4 rounded accent-blue-600 shrink-0"
                    />
                    <span className="text-sm font-medium text-gray-500">
                      #{q.orderIndex}
                    </span>
                    <select
                      value={q.type}
                      onChange={(e) =>
                        updateQuestion(i, "type", e.target.value)
                      }
                      className="text-xs border rounded px-2 py-0.5"
                    >
                      {typeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${getConfidenceColor(q.confidence)}`}
                    >
                      置信度：{getConfidenceLabel(q.confidence)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeQuestion(i)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>

                <textarea
                  value={q.stem}
                  onChange={(e) => updateQuestion(i, "stem", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-2 resize-y"
                  rows={2}
                  placeholder="题干"
                />

                {q.options.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2 text-sm">
                        <span className="w-5 text-gray-400">{opt.key}.</span>
                        <input
                          value={opt.content}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[oi] = { ...opt, content: e.target.value };
                            updateQuestion(i, "options", newOpts);
                          }}
                          className="flex-1 border rounded px-2 py-0.5 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {q.options.length > 0 && (
                  <div className="flex gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => addOption(i)}
                      disabled={q.options.length >= 5}
                      className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      + 添加选项
                    </button>
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={q.options.length <= 2}
                      className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      - 删除选项
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">答案</label>
                    <input
                      value={q.answer.join("、")}
                      onChange={(e) =>
                        updateQuestion(
                          i,
                          "answer",
                          e.target.value.split(/[,，、]/).filter(Boolean)
                        )
                      }
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="text-xs text-gray-400">解析</label>
                    <input
                      value={q.analysis}
                      onChange={(e) =>
                        updateQuestion(i, "analysis", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
