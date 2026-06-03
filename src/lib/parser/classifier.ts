import type { Option, QuestionType } from "@/types";
import {
  OPTION_PATTERNS,
  INLINE_OPTION_RE,
  ANSWER_PATTERNS,
  ANALYSIS_PATTERNS,
  BLANK_RE,
} from "./rules";

interface ClassifiedBlock {
  stem: string;
  options: Option[];
  answer: string[];
  analysis: string;
  type: QuestionType;
  rawText: string;
}

/**
 * Try to extract inline options from a single line.
 * Example: "A. 数组  B. 栈  C. 队列  D. 二叉树"
 */
function extractInlineOptions(line: string): Option[] | null {
  const opts: Option[] = [];
  // Fresh regex — INLINE_OPTION_RE from rules.ts has global flag, needs per-call reset
  const re = new RegExp(INLINE_OPTION_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    opts.push({ key: m[1], content: m[2].trim() });
  }
  return opts.length >= 2 ? opts : null;
}

/**
 * Check if a line starts with an option marker.
 */
function matchOptionLine(line: string): { key: string; content: string } | null {
  for (const pattern of OPTION_PATTERNS) {
    const m = line.match(pattern.regex);
    if (m) {
      return {
        key: m[pattern.keyGroup],
        content: line.replace(pattern.regex, "").trim(),
      };
    }
  }
  return null;
}

/**
 * Try to extract answer from a line.
 */
function matchAnswerLine(line: string): string[] | null {
  for (const pattern of ANSWER_PATTERNS) {
    const m = line.match(pattern.regex);
    if (m) {
      const raw = m[pattern.contentGroup].trim();
      // Split: "A,B" "A、B" "A B" "AB" "A和B" "A与B"
      if (/^[A-Za-z]+$/.test(raw) && raw.length > 1 && raw.length <= 6) {
        return raw.split("");
      }
      return raw.split(/[,，、\s和与&]+/).filter(Boolean);
    }
  }
  return null;
}

/**
 * Try to extract analysis from a line.
 */
function matchAnalysisLine(line: string): string | null {
  for (const pattern of ANALYSIS_PATTERNS) {
    const m = line.match(pattern.regex);
    if (m) {
      return m[pattern.contentGroup].trim();
    }
  }
  return null;
}

/**
 * Classify a single question block: extract stem, options, answer, analysis, type.
 */
export function classifyQuestion(blockText: string): ClassifiedBlock {
  const lines = blockText.split("\n");
  const stemLines: string[] = [];
  const options: Option[] = [];
  const answer: string[] = [];
  let analysis = "";

  let state: "stem" | "options" | "answer" | "analysis" = "stem";
  let firstOptionIdx = -1;

  // ── Pass 1: classify each line ──
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue; // skip blank lines within block

    // Check inline options first (entire option list on one line)
    if (state === "stem" || state === "options") {
      const inlineOpts = extractInlineOptions(trimmed);
      if (inlineOpts && inlineOpts.length >= 2) {
        for (const opt of inlineOpts) {
          options.push(opt);
        }
        state = "options";
        if (firstOptionIdx < 0) firstOptionIdx = i;
        continue;
      }
    }

    // Check answer markers
    const ansMatch = matchAnswerLine(trimmed);
    if (ansMatch) {
      answer.push(...ansMatch);
      state = "answer";
      continue;
    }

    // Check analysis markers
    const anaMatch = matchAnalysisLine(trimmed);
    if (anaMatch) {
      analysis = anaMatch;
      state = "analysis";
      continue;
    }

    // Check option markers (single option per line)
    const optMatch = matchOptionLine(trimmed);
    if (optMatch && (state === "stem" || state === "options")) {
      // If we had stem lines collected, don't keep going back to stem
      if (state === "stem" && stemLines.length > 0) {
        state = "options";
      }
      options.push({ key: optMatch.key, content: optMatch.content });
      if (firstOptionIdx < 0) firstOptionIdx = i;
      continue;
    }

    // Regular content — depends on current state
    if (state === "analysis") {
      analysis += " " + trimmed;
    } else if (state === "answer") {
      // Could be continuation of answer text (for long answers)
      answer.push(trimmed);
    } else if (state === "options" && options.length > 0) {
      // Multi-line option: append to last option's content
      const lastOpt = options[options.length - 1];
      lastOpt.content += " " + trimmed;
    } else {
      stemLines.push(trimmed);
    }
  }

  // ── Post-processing ──

  // If options were found inside the stem, trim the stem to just the text before options
  let stem = stemLines.join("\n").trim();

  // If no options but answer exists, it's likely fill_blank — keep the stem as-is
  // If stem still contains what looks like option markers, try to re-extract
  if (options.length === 0 && stem.trim().length > 0) {
    // Check if the "stem" text actually contains inline options we missed
    const inlineOpts = extractInlineOptions(stem);
    if (inlineOpts && inlineOpts.length >= 2) {
      for (const opt of inlineOpts) options.push(opt);
      // Re-extract stem: everything up to the first option
      const optMatch = stem.match(/([A-Za-z])\s*[\.、．。·)\-）]/);
      if (optMatch && optMatch.index !== undefined) {
        stem = stem.substring(0, optMatch.index).trim();
      }
    }
  }

  // Clean stem: remove leading numbering prefix (e.g., "1.", "一、", "(1)")
  stem = stem.replace(
    /^[\s　]*(\d+[\.、．。·)\-）]\s*|第\s*[一二三四五六七八九十\d]+\s*题[：:．]?\s*|[（(]\d+[）)]\s*|[一二三四五六七八九十]+[、．.]\s*|Q\d+[\.:]\s*)/i,
    ""
  ).trim();

  // Determine question type
  const type = inferType(options, answer, stem);

  return { stem, options, answer, analysis, type, rawText: blockText };
}

// ── Type inference ──

function inferType(options: Option[], answer: string[], stem: string): QuestionType {
  // Has options → choice type
  if (options.length > 0) {
    // True/False detection
    if (options.length <= 2) {
      const optsText = options.map((o) => o.content.toLowerCase()).join(" ");
      const ansText = answer.join(" ").toLowerCase();
      const tfKw = ["对", "错", "正确", "错误", "√", "×", "true", "false", "t", "f", "yes", "no", "是", "否"];
      const hasTF = tfKw.some((kw) => optsText.includes(kw) || ansText.includes(kw));
      if (hasTF && answer.length === 1) {
        return "true_false";
      }
    }

    // Single letter answer → single_choice
    if (answer.length === 1 && /^[A-Za-z]$/.test(answer[0].trim())) {
      return "single_choice";
    }

    // Multiple letter answers → multiple_choice
    if (answer.length > 1 && answer.every((a) => /^[A-Za-z]$/.test(a.trim()))) {
      return "multiple_choice";
    }

    // More than one answer but not all letters → still multiple_choice
    if (answer.length > 1) {
      return "multiple_choice";
    }

    return "single_choice"; // default
  }

  // No options
  if (BLANK_RE.test(stem)) {
    return "fill_blank";
  }

  if (answer.length > 0) {
    return "fill_blank";
  }

  return "fill_blank"; // fallback
}
