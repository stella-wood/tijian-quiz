import { z } from "zod";
import type { Option, QuestionType } from "@/features/questions/contracts";

export const PRACTICE_MODES = ["sequential", "random", "wrong"] as const;
export const PracticeModeSchema = z.enum(PRACTICE_MODES);
export type PracticeMode = z.infer<typeof PracticeModeSchema>;

export const CreateSessionSchema = z.object({
  bankId: z.string().uuid(),
  mode: PracticeModeSchema,
});

export const SubmitAnswerSchema = z.object({
  userAnswer: z.array(z.string().max(10_000)).max(50),
  durationMs: z.number().int().min(0).max(86_400_000).default(0),
});
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;

export interface PracticeQuestionDto {
  id: string;
  type: QuestionType;
  stem: string;
  options: Option[];
}

export interface AnswerResultDto {
  id: string;
  sessionId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  durationMs: number;
  answeredAt: Date;
  standardAnswer: string[];
  analysis: string | null;
  isLastQuestion: boolean;
}

export interface SessionDto {
  id: string;
  bankId: string;
  mode: string;
  questionIds: string;
  totalCount: number;
  correctCount: number;
  currentIndex: number;
  startedAt: Date;
  finishedAt: Date | null;
  status: "active" | "completed";
  currentQuestion: PracticeQuestionDto | null;
  bank?: { title: string };
  answers?: unknown[];
}

export interface UnfinishedSessionDto {
  id: string;
  mode: PracticeMode;
  currentIndex: number;
  totalCount: number;
  startedAt: string;
}

export interface PracticeRepository {
  createSession(bankId: string, mode: PracticeMode): Promise<unknown>;
  getSession(id: string): Promise<SessionDto | null>;
  getUnfinished(bankId: string): Promise<unknown[]>;
  submitAnswer(id: string, input: SubmitAnswerInput): Promise<AnswerResultDto>;
  finish(id: string): Promise<unknown>;
  listWrong(bankId?: string): Promise<unknown[]>;
}
