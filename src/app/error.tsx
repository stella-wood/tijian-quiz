"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h2 className="font-semibold text-red-800">页面加载失败</h2>
      <p className="mt-2 text-sm text-red-700">{error.message || "发生了未预期的错误"}</p>
      <button onClick={unstable_retry} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white">重新尝试</button>
    </div>
  );
}
