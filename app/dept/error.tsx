"use client"; // 错误边界必须是客户端组件

export default function DeptError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold text-gray-800">
        部门数据加载失败
      </h1>

      <p className="mt-2 text-sm text-gray-500">{error.message}</p>

      <button
        type="button"
        className="mt-4 rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        onClick={() => retry()}
      >
        重试
      </button>
    </main>
  );
}