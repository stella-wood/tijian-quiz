export {
  TYPE_LABEL,
  type Option,
  type QuestionType,
} from "@/features/questions/contracts";

import type { Option, QuestionType } from "@/features/questions/contracts";

export interface ParsedQuestion {
  type: QuestionType;
  stem: string;
  options: Option[];
  answer: string[];
  analysis: string;
  orderIndex: number;
  rawText: string;
  confidence: number;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  parseErrors: string[];
}
