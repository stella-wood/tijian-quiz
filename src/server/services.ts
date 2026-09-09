import "server-only";
import { BankService } from "@/features/banks/service";
import { BackupService } from "@/features/backup/service";
import { ImportService } from "@/features/import/service";
import { PracticeService } from "@/features/practice/service";
import { QuestionService } from "@/features/questions/service";
import { PrismaAppRepository } from "@/server/repositories/prisma-repository";

const repository = new PrismaAppRepository();

export const bankService = new BankService(repository);
export const questionService = new QuestionService(repository);
export const importService = new ImportService(repository);
export const practiceService = new PracticeService(repository);
export const backupService = new BackupService(repository);
