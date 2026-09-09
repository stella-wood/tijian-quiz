import { z } from "zod";

export const QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "true_false",
  "fill_blank",
] as const;

export const QuestionTypeSchema = z.enum(QUESTION_TYPES);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const TYPE_LABEL: Record<QuestionType, string> = {
  single_choice: "单选题",
  multiple_choice: "多选题",
  true_false: "判断题",
  fill_blank: "填空题",
};

export const OptionSchema = z.object({
  key: z.string().trim().min(1).max(8).transform((value) => value.toUpperCase()),
  content: z.string().trim().min(1).max(10_000),
});
export type Option = z.infer<typeof OptionSchema>;

export const QuestionDraftSchema = z.object({
  type: QuestionTypeSchema,
  stem: z.string().trim().min(2).max(50_000),
  options: z.array(OptionSchema).max(26).default([]),
  answer: z.array(z.string().trim().min(1).max(10_000)).max(50).default([]),
  analysis: z.string().max(50_000).nullable().optional(),
  orderIndex: z.number().int().nonnegative().default(0),
  rawText: z.string().max(100_000).nullable().optional(),
  confidence: z.number().min(0).max(1).default(1),
});
export type QuestionDraft = z.infer<typeof QuestionDraftSchema>;

export const CreateQuestionSchema = QuestionDraftSchema.extend({
  bankId: z.string().uuid(),
});
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

export const UpdateQuestionSchema = QuestionDraftSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "至少提供一个需要修改的字段"
);
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;

export interface QuestionDto extends QuestionDraft {
  id: string;
  bankId: string;
  analysis: string | null;
  rawText: string | null;
  createdAt: string;
}

export interface LegacyQuestionDto
  extends Omit<QuestionDto, "options" | "answer" | "createdAt"> {
  options: string;
  answer: string;
  createdAt: Date;
}

export interface QuestionRepository {
  findQuestionById(id: string): Promise<QuestionDto | null>;
  listQuestionsByBank(bankId: string): Promise<QuestionDto[]>;
  createQuestion(input: CreateQuestionInput): Promise<QuestionDto>;
  updateQuestion(id: string, input: UpdateQuestionInput): Promise<QuestionDto | null>;
  deleteQuestion(id: string): Promise<boolean>;
}
