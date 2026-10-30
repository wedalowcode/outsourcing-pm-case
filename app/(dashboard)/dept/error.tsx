"use client"; // 错误边界必须是客户端组件

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";

/**
 * 这一版 Next 的错误边界参数是 `retry`（`reset` 只清空错误状态、不重新取数）。
 * 详见 node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md。
 */
export default function DeptError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <PageHeader title="部门数据加载失败" />

      {/* 生产环境的 error.message 会被脱敏，这里只展示可检索的错误编号 */}
      <p className="text-sm text-muted-foreground">
        请稍后重试
        {error.digest ? `（错误编号：${error.digest}）` : ""}
      </p>

      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={() => retry()}
      >
        重试
      </Button>
    </>
  );
}
