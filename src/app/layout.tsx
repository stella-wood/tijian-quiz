import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "智能题库刷题系统",
  description: "文档转题库 + 自适应刷题工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">
        <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-6 text-sm">
            <Link href="/" className="font-bold text-blue-600 hover:text-blue-800">
              题库刷题
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              题库列表
            </Link>
            <Link href="/import" className="text-gray-600 hover:text-gray-900">
              导入题库
            </Link>
            <Link href="/wrong" className="text-gray-600 hover:text-gray-900">
              错题本
            </Link>
          </div>
        </nav>
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
