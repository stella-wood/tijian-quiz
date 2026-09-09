// ── Preprocessing ──

/** Normalize text before parsing: unify newlines, collapse blank lines */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ blank lines to 2
    .trim();
}

// ── Question boundary patterns (ordered from most specific to least) ──

interface Pattern {
  regex: RegExp;
  /** Extract the question number (or null if need to enumerate) */
  extractIndex: (m: RegExpMatchArray) => number | null;
}

export const BOUNDARY_PATTERNS: Pattern[] = [
  // 1.  1、 1)  1） 1． 1· 1-
  { regex: /^\s*(\d+)\s*[\.、．。·)\-）]\s*/,        extractIndex: (m) => parseInt(m[1], 10) },
  // (1) （1） （1
  { regex: /^\s*[（(]\s*(\d+)\s*[）)]?\s*/,          extractIndex: (m) => parseInt(m[1], 10) },
  // ① ② ③ ...
  { regex: /^\s*[①②③④⑤⑥⑦⑧⑨⑩]/,                  extractIndex: () => null },
  // 一、 二、 三、 ...
  { regex: /^\s*[一二三四五六七八九十]+[、．.]\s*/,   extractIndex: () => null },
  // 第X题 第X题：
  { regex: /^第\s*[一二三四五六七八九十\d]+\s*题[：:．]?\s*/, extractIndex: () => null },
  // 问题1： 题目1：
  { regex: /^\s*(?:问题|题目|试题)\s*(\d+)\s*[：:．]?\s*/, extractIndex: (m) => parseInt(m[1], 10) },
  // Q1. Q1:
  { regex: /^\s*Q\s*(\d+)\s*[\.:：]?\s*/i,           extractIndex: (m) => parseInt(m[1], 10) },
];

// ── Option patterns ──

export const OPTION_PATTERNS: { regex: RegExp; keyGroup: number }[] = [
  // A. A、 A) A） A． A- A·
  { regex: /^\s*([A-Za-z])\s*[\.、．。·)\-）]\s*/,        keyGroup: 1 },
  // (A) （A） （A
  { regex: /^\s*[（(]\s*([A-Za-z])\s*[）)]?\s*/,          keyGroup: 1 },
  // 【A】
  { regex: /^\s*【\s*([A-Za-z])\s*】\s*/,                keyGroup: 1 },
];

// Inline option pattern: "A. xxx  B. xxx  C. xxx"
export const INLINE_OPTION_RE = /([A-Za-z])\s*[\.、．。·)\-）]\s*([^\n]+?)(?=\s+[A-Za-z]\s*[\.、．。·)\-）]|$)/g;

// ── Answer patterns ──

export const ANSWER_PATTERNS: { regex: RegExp; contentGroup: number }[] = [
  // 答案:  答案：  答案
  { regex: /^[（(【]?\s*(?:答案|参考答案|标准答案|正确答案|正确选项)\s*[）)】]?\s*[：:]\s*(.+)/, contentGroup: 1 },
  // 【答案】xxx  【答案】 xxx
  { regex: /^【\s*(?:答案|参考答案|标准答案|正确答案)\s*】\s*(.+)/, contentGroup: 1 },
  // 答案：xxx (full-width)
  { regex: /^(?:答案|参考答案|标准答案|正确答案)\s*[：:]\s*(.+)/, contentGroup: 1 },
];

// ── Analysis patterns ──

export const ANALYSIS_PATTERNS: { regex: RegExp; contentGroup: number }[] = [
  { regex: /^[（(【]?\s*(?:解析|答案解析|试题解析|解题思路|试题分析|详解|分析)\s*[）)】]?\s*[：:]\s*(.+)/, contentGroup: 1 },
  { regex: /^【\s*(?:解析|答案解析|试题解析|解题思路|详解|分析)\s*】\s*(.+)/, contentGroup: 1 },
  { regex: /^(?:解析|答案解析|试题解析|解题思路|详解)\s*[：:]\s*(.+)/, contentGroup: 1 },
];

// ── Fill-blank markers in stem ──

export const BLANK_RE = /[（(]\s*[）)]|_{2,}|\.{4,}|【\s*】/;
