import { z } from "zod";
import { QuestionDraftSchema } from "@/features/questions/contracts";

export const ImportCommitSchema = z.object({
  title: z.string().trim().min(1, "题库名称不能为空").max(200),
  questions: z.array(QuestionDraftSchema).min(1, "没有可导入的题目").max(10_000),
});
export type ImportCommitRequest = z.infer<typeof ImportCommitSchema>;

export interface ImportCommitResponse {
  bankId: string;
  questionCount: number;
}

export interface ImportRepository {
  commit(input: ImportCommitRequest): Promise<ImportCommitResponse>;
}
