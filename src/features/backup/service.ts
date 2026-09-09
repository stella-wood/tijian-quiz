import { AppError } from "@/features/errors";
import type {
  BackupManifestV1,
  BackupRepository,
} from "./contracts";

export class BackupService {
  constructor(private readonly repository: BackupRepository) {}

  exportManifest() {
    return this.repository.exportManifest();
  }

  importManifest(manifest: BackupManifestV1) {
    this.validateReferences(manifest);
    return this.repository.importManifest(manifest);
  }

  private validateReferences(manifest: BackupManifestV1) {
    const bankIds = new Set(manifest.data.banks.map((item) => item.id));
    const questionIds = new Set(manifest.data.questions.map((item) => item.id));
    const sessionIds = new Set(manifest.data.sessions.map((item) => item.id));
    const questionBanks = new Map(
      manifest.data.questions.map((item) => [item.id, item.bankId])
    );
    const sessions = new Map(manifest.data.sessions.map((item) => [item.id, item]));

    for (const [name, items] of Object.entries(manifest.data)) {
      const ids = new Set<string>();
      for (const item of items) {
        if (ids.has(item.id)) {
          throw new AppError(
            `备份文件的 ${name} 包含重复 ID`,
            "VALIDATION_ERROR",
            400
          );
        }
        ids.add(item.id);
      }
    }

    const invalidQuestion = manifest.data.questions.find((item) => !bankIds.has(item.bankId));
    const invalidSession = manifest.data.sessions.find((item) => {
      const invalidCounts =
        item.totalCount !== item.questionIds.length ||
        item.currentIndex > item.totalCount ||
        item.correctCount > item.currentIndex;
      const invalidQuestions = item.questionIds.some(
        (id) => !questionIds.has(id) || questionBanks.get(id) !== item.bankId
      );
      return !bankIds.has(item.bankId) || invalidCounts || invalidQuestions;
    });
    const invalidAnswer = manifest.data.answers.find(
      (item) => {
        const session = sessions.get(item.sessionId);
        return (
          !sessionIds.has(item.sessionId) ||
          !questionIds.has(item.questionId) ||
          !session?.questionIds.includes(item.questionId)
        );
      }
    );
    const invalidWrong = manifest.data.wrongQuestions.find(
      (item) => !questionIds.has(item.questionId)
    );

    if (invalidQuestion || invalidSession || invalidAnswer || invalidWrong) {
      throw new AppError(
        "备份文件包含无效的关联关系",
        "VALIDATION_ERROR",
        400
      );
    }

    const answerKeys = new Set<string>();
    for (const answer of manifest.data.answers) {
      const key = `${answer.sessionId}:${answer.questionId}`;
      if (answerKeys.has(key)) {
        throw new AppError("备份文件包含重复答题记录", "VALIDATION_ERROR", 400);
      }
      answerKeys.add(key);
    }

    const wrongQuestionIds = new Set<string>();
    for (const item of manifest.data.wrongQuestions) {
      if (wrongQuestionIds.has(item.questionId)) {
        throw new AppError("备份文件包含重复错题状态", "VALIDATION_ERROR", 400);
      }
      wrongQuestionIds.add(item.questionId);
    }
  }
}
