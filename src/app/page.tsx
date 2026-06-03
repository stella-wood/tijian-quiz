import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const banks = await prisma.questionBank.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">我的题库</h1>
        <Link
          href="/import"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          + 导入题库
        </Link>
      </div>

      {banks.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">还没有题库</p>
          <p className="text-sm">
            点击「
            <Link href="/import" className="text-blue-600 hover:underline">
              导入题库
            </Link>
            」上传文档开始使用
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {banks.map((bank) => (
            <Link
              key={bank.id}
              href={`/banks/${bank.id}`}
              className="block bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-gray-900">{bank.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {bank._count.questions} 道题目 ·{" "}
                    {new Date(bank.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <span className="text-gray-400 text-lg">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
