import Link from "next/link";
import { notFound } from "next/navigation";
import { bankService, questionService } from "@/server/services";
import { AppError } from "@/features/errors";
import { BankActions } from "./BankActions";
import { BankQuestionsList } from "./BankQuestionsList";

export const dynamic = "force-dynamic";

export default async function BankDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let bank;
  try {
    bank = await bankService.get(id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const questions = await questionService.listByBank(id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
            ← 返回题库列表
          </Link>
          <h1 className="text-xl font-bold">{bank.title}</h1>
          <p className="text-sm text-gray-500">{questions.length} 道题目</p>
        </div>
      </div>

      <BankActions bankId={bank.id} questionCount={questions.length} />

      {questions.length === 0 ? (
        <p className="text-center py-10 text-gray-500">暂无题目</p>
      ) : (
        <div className="mt-6">
          <BankQuestionsList questions={questions} />
        </div>
      )}
    </div>
  );
}
