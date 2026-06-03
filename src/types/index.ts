export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "fill_blank";

export const TYPE_LABEL: Record<QuestionType, string> = {
  single_choice: "单选题",
  multiple_choice: "多选题",
  true_false: "判断题",
  fill_blank: "填空题",
};

export interface Option {
  key: string;
  content: string;
}

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

