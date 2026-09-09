import { AppError } from "@/features/errors";
import type {
  PracticeMode,
  PracticeRepository,
  SubmitAnswerInput,
} from "./contracts";

export class PracticeService {
  constructor(private readonly repository: PracticeRepository) {}

  createSession(bankId: string, mode: PracticeMode) {
    return this.repository.createSession(bankId, mode);
  }

  async getSession(id: string) {
    const session = await this.repository.getSession(id);
    if (!session) throw new AppError("练习会话不存在", "NOT_FOUND", 404);
    return session;
  }

  getUnfinished(bankId: string) {
    return this.repository.getUnfinished(bankId);
  }

  submitAnswer(id: string, input: SubmitAnswerInput) {
    return this.repository.submitAnswer(id, input);
  }

  finish(id: string) {
    return this.repository.finish(id);
  }

  listWrong(bankId?: string) {
    return this.repository.listWrong(bankId);
  }
}
