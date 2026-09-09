import type { QuestionType } from "@/types";

function normalize(str: string): string {
  return str.trim().toLowerCase();
}

function normalizeChoice(str: string | undefined): string {
  return (str ?? "").trim().toUpperCase();
}

export function judgeAnswer(
  type: QuestionType,
  userAnswer: string[],
  standardAnswer: string[]
): boolean {
  switch (type) {
    case "single_choice": {
      return normalizeChoice(userAnswer[0]) === normalizeChoice(standardAnswer[0]);
    }
    case "multiple_choice": {
      const ua = userAnswer.map(normalizeChoice).sort();
      const sa = standardAnswer.map(normalizeChoice).sort();
      return ua.length === sa.length && ua.every((v, i) => v === sa[i]);
    }
    case "true_false": {
      const trueMap: Record<string, string> = {
        "对": "t", "正确": "t", "√": "t", "true": "t", "yes": "t",
        "错": "f", "错误": "f", "×": "f", "false": "f", "no": "f",
      };
      const u = trueMap[normalize(userAnswer[0] ?? "")] ?? userAnswer[0] ?? "";
      const s = trueMap[normalize(standardAnswer[0] ?? "")] ?? standardAnswer[0] ?? "";
      return u === s;
    }
    case "fill_blank": {
      // Support multiple blanks: all must match pairwise
      if (userAnswer.length !== standardAnswer.length) return false;
      return userAnswer.every(
        (ua, i) => normalize(ua) === normalize(standardAnswer[i] ?? "")
      );
    }
    default:
      return false;
  }
}
