// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QuestionEditor } from "@/features/questions/QuestionEditor";

describe("shared UI", () => {
  it("requires an explicit confirmation", () => {
    const confirm = vi.fn();
    render(<ConfirmDialog open title="删除？" description="说明" onConfirm={confirm} onCancel={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));
    expect(confirm).toHaveBeenCalledOnce();
  });

  it("edits a question through a typed component contract", () => {
    const change = vi.fn();
    render(<QuestionEditor value={{
      id: "00000000-0000-4000-8000-000000000000",
      bankId: "00000000-0000-4000-8000-000000000001",
      type: "single_choice",
      stem: "原题干内容",
      options: [{ key: "A", content: "选项" }, { key: "B", content: "选项二" }],
      answer: ["A"],
      analysis: null,
      orderIndex: 1,
      rawText: null,
      confidence: 1,
      createdAt: new Date(0).toISOString(),
    }} busy={false} onChange={change} onSave={() => undefined} onCancel={() => undefined} />);
    fireEvent.change(screen.getByLabelText("题干"), { target: { value: "新题干内容" } });
    expect(change).toHaveBeenCalledWith(expect.objectContaining({ stem: "新题干内容" }));
  });
});
