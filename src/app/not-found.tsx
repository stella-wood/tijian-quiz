import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-xl font-semibold text-gray-900">内容不存在</h1>
      <p className="mt-2 text-sm text-gray-500">题库、题目或页面可能已被删除。</p>
      <Link href="/" className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">返回首页</Link>
    </div>
  );
}
