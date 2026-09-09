import { requestJson } from "@/features/http-client";
import type { QuestionDto, UpdateQuestionInput } from "./contracts";

interface LegacyQuestionResponse extends Omit<QuestionDto, "options" | "answer" | "createdAt"> {
  options: string;
  answer: string;
  createdAt: string;
}

function decodeQuestion(question: LegacyQuestionResponse): QuestionDto {
  return {
    ...question,
    options: JSON.parse(question.options),
    answer: JSON.parse(question.answer),
  };
}

export async function updateQuestion(id: string, input: UpdateQuestionInput) {
  const question = await requestJson<LegacyQuestionResponse>(`/api/questions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return decodeQuestion(question);
}

export function deleteQuestion(id: string) {
  return requestJson<{ success: true }>(`/api/questions/${id}`, { method: "DELETE" });
}
