import { z } from "zod";
import { OptionSchema, QuestionTypeSchema } from "@/features/questions/contracts";
import { PracticeModeSchema } from "@/features/practice/contracts";

const IsoDateSchema = z.string().datetime({ offset: true });
const IdSchema = z.string().uuid();

const BackupBankSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(200),
  createdAt: IsoDateSchema,
});

const BackupQuestionSchema = z.object({
  id: IdSchema,
  bankId: IdSchema,
  type: QuestionTypeSchema,
  stem: z.string().min(2).max(50_000),
  options: z.array(OptionSchema).max(26),
  answer: z.array(z.string().max(10_000)).max(50),
  analysis: z.string().max(50_000).nullable(),
  orderIndex: z.number().int().nonnegative(),
  rawText: z.string().max(100_000).nullable(),
  confidence: z.number().min(0).max(1),
  createdAt: IsoDateSchema,
});

const BackupSessionSchema = z.object({
  id: IdSchema,
  bankId: IdSchema,
  mode: PracticeModeSchema,
  questionIds: z.array(IdSchema).max(10_000),
  totalCount: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  currentIndex: z.number().int().nonnegative(),
  startedAt: IsoDateSchema,
  finishedAt: IsoDateSchema.nullable(),
});

const BackupAnswerSchema = z.object({
  id: IdSchema,
  sessionId: IdSchema,
  questionId: IdSchema,
  userAnswer: z.array(z.string().max(10_000)).max(50),
  isCorrect: z.boolean(),
  durationMs: z.number().int().min(0).max(86_400_000),
  answeredAt: IsoDateSchema,
});

const BackupWrongQuestionSchema = z.object({
  id: IdSchema,
  questionId: IdSchema,
  wrongCount: z.number().int().positive(),
  lastWrongAt: IsoDateSchema,
});

export const BackupManifestV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: IsoDateSchema,
    appVersion: z.string().min(1).max(50),
    data: z.object({
      banks: z.array(BackupBankSchema).max(10_000),
      questions: z.array(BackupQuestionSchema).max(100_000),
      sessions: z.array(BackupSessionSchema).max(100_000),
      answers: z.array(BackupAnswerSchema).max(1_000_000),
      wrongQuestions: z.array(BackupWrongQuestionSchema).max(100_000),
    }),
  })
  .strict();

export type BackupManifestV1 = z.infer<typeof BackupManifestV1Schema>;
export type BackupEntityName = keyof BackupManifestV1["data"];

export interface BackupImportStats {
  inserted: Record<BackupEntityName, number>;
  skipped: Record<BackupEntityName, number>;
}

export interface BackupRepository {
  exportManifest(): Promise<BackupManifestV1>;
  importManifest(manifest: BackupManifestV1): Promise<BackupImportStats>;
}
