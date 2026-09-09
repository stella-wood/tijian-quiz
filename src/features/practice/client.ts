import { requestJson } from "@/features/http-client";
import type { Option, QuestionType } from "@/features/questions/contracts";
import type { AnswerResultDto, PracticeMode, UnfinishedSessionDto } from "./contracts";

export interface ClientQuestion {
  id: string;
  type: QuestionType;
  stem: string;
  options: Option[];
  answer: string[];
  analysis: string | null;
}

export interface ClientAnswerHistory {
  question: ClientQuestion;
  userAnswer: string[];
  isCorrect: boolean;
}

export interface ClientSession {
  id: string;
  bankId: string;
  currentIndex: number;
  totalCount: number;
  correctCount: number;
  mode: string;
  questionIds: string;
  finishedAt: string | null;
  status: "active" | "completed";
  currentQuestion: ClientQuestion | null;
  answers: ClientAnswerHistory[];
}

export interface WrongQuestionView {
  id: string;
  questionId: string;
  wrongCount: number;
  lastWrongAt: string;
  question: ClientQuestion & { bankId: string; bank: { id: string; title: string } };
}

function parseArray<T>(value: unknown): T[] {
  if (typeof value !== "string") return Array.isArray(value) ? value as T[] : [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export function createSession(bankId: string, mode: PracticeMode) {
  return requestJson<{ id: string }>("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bankId, mode }),
  });
}

export async function getSession(id: string): Promise<ClientSession> {
  const data = await requestJson<Record<string, unknown>>(`/api/sessions/${id}`);
  const answers = Array.isArray(data.answers) ? data.answers : [];
  const current = data.currentQuestion as Record<string, unknown> | null;
  return {
    ...(data as Omit<ClientSession, "answers">),
    currentQuestion: current ? {
      id: current.id as string,
      type: current.type as QuestionType,
      stem: current.stem as string,
      options: parseArray<Option>(current.options),
      answer: [],
      analysis: null,
    } : null,
    answers: answers.map((item) => {
      const answer = item as Record<string, unknown>;
      const question = answer.question as Record<string, unknown>;
      return {
        question: {
          id: question.id as string,
          type: question.type as QuestionType,
          stem: question.stem as string,
          options: parseArray<Option>(question.options),
          answer: parseArray<string>(question.answer),
          analysis: (question.analysis as string | null) ?? null,
        },
        userAnswer: parseArray<string>(answer.userAnswer),
        isCorrect: Boolean(answer.isCorrect),
      };
    }),
  };
}

export function getUnfinishedSessions(bankId: string) {
  return requestJson<UnfinishedSessionDto[]>(`/api/banks/${bankId}/sessions/unfinished`);
}

export function submitAnswer(id: string, userAnswer: string[], durationMs: number) {
  return requestJson<AnswerResultDto>(`/api/sessions/${id}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAnswer, durationMs }),
  });
}

export async function getWrongQuestions(): Promise<WrongQuestionView[]> {
  const rows = await requestJson<Array<Record<string, unknown>>>("/api/wrong-questions");
  return rows.map((row) => {
    const question = row.question as Record<string, unknown>;
    return {
      id: row.id as string,
      questionId: row.questionId as string,
      wrongCount: row.wrongCount as number,
      lastWrongAt: row.lastWrongAt as string,
      question: {
        id: question.id as string,
        bankId: question.bankId as string,
        type: question.type as QuestionType,
        stem: question.stem as string,
        options: parseArray<Option>(question.options),
        answer: parseArray<string>(question.answer),
        analysis: (question.analysis as string | null) ?? null,
        bank: question.bank as { id: string; title: string },
      },
    };
  });
}
