import Link from "next/link";
import { BankList } from "@/features/banks/BankList";
import { BackupActions } from "@/features/backup/BackupActions";
import { bankService } from "@/server/services";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const banks = await bankService.list();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">我的题库</h1>
        <Link href="/import" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          + 导入题库
        </Link>
      </div>
      <BackupActions />
      <BankList initialBanks={banks} />
    </div>
  );
}
