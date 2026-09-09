import { describe, expect, it } from "vitest";
import { decodeQuestionFile } from "./decode";

describe("decodeQuestionFile", () => {
  it("removes an UTF-8 BOM", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode("题目")]);
    expect(decodeQuestionFile(bytes.buffer)).toBe("题目");
  });

  it("decodes valid UTF-8", () => {
    const bytes = new TextEncoder().encode("答案：对");
    expect(decodeQuestionFile(bytes.buffer)).toBe("答案：对");
  });
});
