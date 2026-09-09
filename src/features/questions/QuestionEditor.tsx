"use client";

import type { QuestionDto, QuestionType } from "./contracts";
import { TYPE_LABEL } from "./contracts";

export function QuestionEditor({
  value,
  busy,
  onChange,
  onSave,
  onCancel,
}: {
  value: QuestionDto;
  busy: boolean;
  onChange: (value: QuestionDto) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function updateOption(index: number, content: string) {
    onChange({
      ...value,
      options: value.options.map((option, current) =>
        current === index ? { ...option, content } : option
      ),
    });
  }

  function addOption() {
    if (value.options.length >= 26) return;
    onChange({
      ...value,
      options: [
        ...value.options,
        { key: String.fromCharCode(65 + value.options.length), content: "" },
      ],
    });
  }

  return (
    <div className="space-y-3">
      <select
        aria-label="题型"
        value={value.type}
        onChange={(event) => onChange({ ...value, type: event.target.value as QuestionType })}
        className="rounded border px-2 py-1 text-sm"
      >
        {Object.entries(TYPE_LABEL).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
      </select>
      <textarea aria-label="题干" value={value.stem} onChange={(event) => onChange({ ...value, stem: event.target.value })} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" />
      {value.options.map((option, index) => (
        <div key={`${option.key}-${index}`} className="flex items-center gap-2">
          <span className="w-6 text-sm text-gray-500">{option.key}.</span>
          <input aria-label={`选项 ${option.key}`} value={option.content} onChange={(event) => updateOption(index, event.target.value)} className="flex-1 rounded border px-2 py-1 text-sm" />
        </div>
      ))}
      {value.type !== "fill_blank" && (
        <div className="flex gap-3 text-xs">
          <button type="button" onClick={addOption} className="text-blue-600">+ 添加选项</button>
          <button type="button" disabled={value.options.length <= 2} onClick={() => onChange({ ...value, options: value.options.slice(0, -1) })} className="text-gray-500 disabled:opacity-40">- 删除末项</button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-gray-500">答案
          <input value={value.answer.join("、")} onChange={(event) => onChange({ ...value, answer: event.target.value.split(/[,，、]/).map((item) => item.trim()).filter(Boolean) })} className="mt-1 w-full rounded border px-2 py-1 text-sm text-gray-900" />
        </label>
        <label className="text-xs text-gray-500 sm:col-span-2">解析
          <input value={value.analysis ?? ""} onChange={(event) => onChange({ ...value, analysis: event.target.value })} className="mt-1 w-full rounded border px-2 py-1 text-sm text-gray-900" />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border px-3 py-1.5 text-sm">取消</button>
        <button type="button" disabled={busy} onClick={onSave} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">{busy ? "保存中..." : "保存"}</button>
      </div>
    </div>
  );
}
