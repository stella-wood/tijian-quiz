import type { ParsedQuestion, ParseResult } from "@/types";
import { normalizeText, BLANK_RE } from "./rules";
import { splitQuestions } from "./splitter";
import { classifyQuestion } from "./classifier";

/**
 * Strip markdown syntax from text while preserving content.
 * Keeps: paragraphs, numbers, letters, Chinese characters, punctuation.
 */
function stripMarkdown(text: string): string {
  return text
    // Remove heading markers but keep the text
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove unordered list markers
    // For "  - A. xxx" style lines, strip just the "- " to leave "A. xxx"
    .replace(/^\s*[-*+]\s+(?=[A-Za-z]\s*[\.、．。·)\-）])/gm, "")
    // For other list markers (not followed by option letter), remove completely
    .replace(/^\s*[-*+]\s+/gm, "")
    // Remove blockquote markers
    .replace(/^\s*>\s+/gm, "")
    // Remove link syntax: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove images: ![alt](url) → alt
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
}

/**
 * Calculate confidence score (0-1).
 */
function calculateConfidence(
  stem: string,
  optionsCount: number,
  answer: string[],
  analysis: string,
  rawText: string
): number {
  let score = 0.0;

  // Stem length reasonable
  if (stem.length >= 8) score += 0.25;
  if (stem.length >= 20) score += 0.05;

  // Options look right
  if (optionsCount >= 2 && optionsCount <= 6) score += 0.25;
  if (optionsCount === 4) score += 0.05; // very common pattern

  // Answer found
  if (answer.length > 0) score += 0.3;

  // Analysis found
  if (analysis.length > 0) score += 0.1;

  // Stem doesn't contain leaked markers
  if (!/[答案][：:]|[解析][：:]|【答案】|【解析】/.test(stem)) score += 0.05;

  // Raw text has clear structure (has newlines with content)
  if (rawText.split("\n").filter((l) => l.trim()).length >= 3) score += 0.05;

  return Math.round(Math.min(score, 1.0) * 100) / 100;
}

/**
 * Parse raw text from .txt or .md file into structured questions.
 */
export function parseText(rawText: string): ParseResult {
  const text = stripMarkdown(normalizeText(rawText));

  if (!text || text.trim().length === 0) {
    return { questions: [], parseErrors: ["文件内容为空"] };
  }

  const blocks = splitQuestions(text);

  if (blocks.length === 0) {
    return {
      questions: [],
      parseErrors: [
        "未能从文档中识别到题目。",
        "请确认文档包含题目，常见格式：",
        "1. 题干内容 / A. 选项A / B. 选项B / 答案: A / 解析: ...",
        "支持 .txt 和 .md 文件，支持中文/英文标点。",
      ],
    };
  }

  const questions: ParsedQuestion[] = [];
  const parseErrors: string[] = [];

  for (const block of blocks) {
    const classified = classifyQuestion(block.text);

    if (!classified.stem || classified.stem.trim().length < 2) {
      parseErrors.push(`第 ${block.orderIndex} 题：未能提取到题干`);
      continue;
    }

    const confidence = calculateConfidence(
      classified.stem,
      classified.options.length,
      classified.answer,
      classified.analysis,
      classified.rawText
    );

    questions.push({
      type: classified.type,
      stem: classified.stem,
      options: classified.options,
      answer: classified.answer,
      analysis: classified.analysis,
      orderIndex: block.orderIndex,
      rawText: classified.rawText,
      confidence,
    });
  }

  return { questions, parseErrors };
}
