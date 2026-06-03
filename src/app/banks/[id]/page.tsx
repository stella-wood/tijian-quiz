import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BankActions } from "./BankActions";
import { TYPE_LABEL } from "@/types";
import { safeJsonParse } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

export default async function BankDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bank = await prisma.questionBank.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!bank) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
            ← 返回题库列表
          </Link>
          <h1 className="text-xl font-bold">{bank.title}</h1>
          <p className="text-sm text-gray-500">{bank.questions.length} 道题目</p>
        </div>
      </div>

      <BankActions bankId={bank.id} questionCount={bank.questions.length} />

      {bank.questions.length === 0 ? (
        <p className="text-center py-10 text-gray-500">暂无题目</p>
      ) : (
        <div className="space-y-3 mt-6">
          {bank.questions.map((q) => {
            const options = safeJsonParse<{ key: string; content: string }[]>(q.options, []);
            const answer = safeJsonParse<string[]>(q.answer, []);
            return (
              <div key={q.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">
                    {q.orderIndex}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {TYPE_LABEL[q.type as keyof typeof TYPE_LABEL] ?? q.type}
                      </span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{q.stem}</p>
                    {options.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                        {options.map((opt) => (
                          <div
                            key={opt.key}
                            className={
                              answer.includes(opt.key)
                                ? "text-green-700 font-medium"
                                : ""
                            }
                          >
                            {opt.key}. {opt.content}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      答案：{answer.join("、")}
                      {q.analysis && ` · 解析：${q.analysis}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
