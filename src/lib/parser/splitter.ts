import { BOUNDARY_PATTERNS, OPTION_PATTERNS } from "./rules";

/**
 * Try to match a line against all boundary patterns.
 * Returns the question index if matched, or null if this is not a question start.
 */
function tryMatchBoundary(line: string, fallbackIndex: number): number | null {
  for (const pattern of BOUNDARY_PATTERNS) {
    const m = line.match(pattern.regex);
    if (m) {
      const idx = pattern.extractIndex(m);
      return idx ?? fallbackIndex;
    }
  }
  return null;
}

/**
 * Check if a line looks like an option line (A. xxx etc).
 */
function looksLikeOption(line: string): boolean {
  for (const pattern of OPTION_PATTERNS) {
    if (pattern.regex.test(line)) return true;
  }
  return false;
}

/**
 * Heuristic: does this text block look like it contains a question?
 * Checks for presence of option markers, answer markers, or fill-blank indicators.
 */
function looksLikeQuestion(lines: string[]): boolean {
  const text = lines.join("\n");
  if (text.trim().length < 5) return false;

  // Has option markers
  for (const line of lines) {
    if (looksLikeOption(line)) return true;
  }

  // Has answer/analysis markers
  if (/答案|解析|参考答案|正确答案|解题思路/.test(text)) return true;

  // Looks like fill-blank
  if (/[（(]\s*[）)]|_{2,}|____/.test(text)) return true;

  // Short text that could be a simple question
  if (lines.length >= 1 && lines[0].trim().length > 10) return true;

  return false;
}

export interface QuestionBlock {
  orderIndex: number;
  text: string;
}

/**
 * Split raw text into question blocks.
 *
 * Strategy:
 * 1. First pass: find numbered question boundaries (1. 2. etc.)
 * 2. Second pass: if no boundaries found, try blank-line splitting + heuristic
 */
export function splitQuestions(text: string): QuestionBlock[] {
  if (!text || text.trim().length === 0) return [];

  const lines = text.split("\n");

  // ── Strategy 1: Numbered boundaries ──
  const blocks: QuestionBlock[] = [];
  let currentBlock: string[] = [];
  let currentIndex = -1;
  let foundBoundary = false;
  let autoIndex = 0; // running counter for non-numeric numbering (Chinese etc.)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fallbackIdx = autoIndex + 1;
    const matched = tryMatchBoundary(line, fallbackIdx);

    if (matched !== null) {
      foundBoundary = true;
      // Save previous block
      if (currentBlock.length > 0 && currentIndex >= 0) {
        blocks.push({ orderIndex: currentIndex, text: currentBlock.join("\n").trim() });
      }
      currentBlock = [line];
      currentIndex = matched;
      autoIndex = Math.max(autoIndex, matched);
    } else if (currentIndex >= 0) {
      currentBlock.push(line);
    }
    // Lines before first boundary are ignored (header/intro text)
  }

  // Save last block
  if (currentBlock.length > 0 && currentIndex >= 0) {
    blocks.push({ orderIndex: currentIndex, text: currentBlock.join("\n").trim() });
  }

  if (foundBoundary && blocks.length > 0) {
    return blocks;
  }

  // ── Strategy 2: Blank-line splitting ──
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);

  if (paragraphs.length === 0) return [];

  // Check if these paragraphs look like questions
  const questionParagraphs = paragraphs.filter((p) => looksLikeQuestion(p.split("\n")));

  if (questionParagraphs.length > 0) {
    return questionParagraphs.map((p, i) => ({
      orderIndex: i + 1,
      text: p,
    }));
  }

  // ── Strategy 3: Last resort — treat the whole text as one question ──
  if (text.trim().length > 20) {
    return [{ orderIndex: 1, text: text.trim() }];
  }

  return [];
}
