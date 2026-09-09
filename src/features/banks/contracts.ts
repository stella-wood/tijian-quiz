import { z } from "zod";

export const BankIdSchema = z.string().uuid("题库 ID 格式无效");
export const CreateBankSchema = z.object({
  title: z.string().trim().min(1, "题库名称不能为空").max(200),
});
export type CreateBankInput = z.infer<typeof CreateBankSchema>;

export interface BankSummaryDto {
  id: string;
  title: string;
  createdAt: Date;
  _count: { questions: number };
}

export interface BankRepository {
  listBanks(): Promise<BankSummaryDto[]>;
  findBankById(id: string): Promise<BankSummaryDto | null>;
  createBank(input: CreateBankInput): Promise<{ id: string; title: string; createdAt: Date }>;
  deleteBank(id: string): Promise<boolean>;
}
