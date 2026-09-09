import { describe, expect, it } from "vitest";
import { judgeAnswer } from "./judge";

describe("judgeAnswer", () => {
  it("normalizes single-choice casing and whitespace", () => {
    expect(judgeAnswer("single_choice", [" a "], ["A"])).toBe(true);
  });

  it("compares multiple choices as a normalized set", () => {
    expect(judgeAnswer("multiple_choice", ["b", "A"], ["A", "B"])).toBe(true);
  });

  it("normalizes true/false aliases", () => {
    expect(judgeAnswer("true_false", ["正确"], ["对"])).toBe(true);
    expect(judgeAnswer("true_false", ["×"], ["false"])).toBe(true);
  });

  it("requires every blank to match", () => {
    expect(judgeAnswer("fill_blank", [" TCP ", "IP"], ["tcp", "ip"])).toBe(true);
    expect(judgeAnswer("fill_blank", ["TCP"], ["TCP", "IP"])).toBe(false);
  });
});
