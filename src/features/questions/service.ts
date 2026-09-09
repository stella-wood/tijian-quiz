import { AppError } from "@/features/errors";
import type {
  CreateQuestionInput,
  QuestionRepository,
  UpdateQuestionInput,
} from "./contracts";

export class QuestionService {
  constructor(private readonly repository: QuestionRepository) {}

  listByBank(bankId: string) {
    return this.repository.listQuestionsByBank(bankId);
  }

  async get(id: string) {
    const question = await this.repository.findQuestionById(id);
    if (!question) throw new AppError("题目不存在", "NOT_FOUND", 404);
    return question;
  }

  create(input: CreateQuestionInput) {
    return this.repository.createQuestion(input);
  }

  async update(id: string, input: UpdateQuestionInput) {
    const question = await this.repository.updateQuestion(id, input);
    if (!question) throw new AppError("题目不存在", "NOT_FOUND", 404);
    return question;
  }

  async delete(id: string) {
    const deleted = await this.repository.deleteQuestion(id);
    if (!deleted) throw new AppError("题目不存在", "NOT_FOUND", 404);
    return { success: true };
  }
}
