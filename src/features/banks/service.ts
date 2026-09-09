import { AppError } from "@/features/errors";
import type { BankRepository, CreateBankInput } from "./contracts";

export class BankService {
  constructor(private readonly repository: BankRepository) {}

  list() {
    return this.repository.listBanks();
  }

  async get(id: string) {
    const bank = await this.repository.findBankById(id);
    if (!bank) throw new AppError("题库不存在", "NOT_FOUND", 404);
    return bank;
  }

  create(input: CreateBankInput) {
    return this.repository.createBank(input);
  }

  async delete(id: string) {
    const deleted = await this.repository.deleteBank(id);
    if (!deleted) throw new AppError("题库不存在", "NOT_FOUND", 404);
    return { success: true };
  }
}
