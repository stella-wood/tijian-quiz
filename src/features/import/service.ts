import type { ImportCommitRequest, ImportRepository } from "./contracts";

export class ImportService {
  constructor(private readonly repository: ImportRepository) {}

  commit(input: ImportCommitRequest) {
    return this.repository.commit(input);
  }
}
