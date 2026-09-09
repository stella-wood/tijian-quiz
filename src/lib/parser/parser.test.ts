import { describe, expect, it } from "vitest";
import { parseText } from "./index";

describe("parseText", () => {
  it("parses choice questions and normalizes option keys", () => {
    const result = parseText("1. 首都是？\na. 北京\nb. 上海\n答案: a");
    expect(result.questions[0]).toMatchObject({
      type: "single_choice",
      answer: ["A"],
      options: [{ key: "A", content: "北京" }, { key: "B", content: "上海" }],
    });
  });

  it("recognizes a true/false question without source options", () => {
    const result = parseText("1. TCP 是面向连接的协议。\n答案：对");
    expect(result.questions[0].type).toBe("true_false");
    expect(result.questions[0].options.map((item) => item.key)).toEqual(["对", "错"]);
  });

  it("removes markdown image syntax without leaving punctuation", () => {
    const result = parseText("1. ![示意图](image.png) 表示什么？\nA. 一\nB. 二\n答案: A");
    expect(result.questions[0].stem).toContain("示意图");
    expect(result.questions[0].stem).not.toContain("!");
  });
});
