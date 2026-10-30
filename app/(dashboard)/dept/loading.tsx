import { PageHeader } from "@/components/common/page-header";

/** 骨架屏与真实页面保持同一栅格，加载完成时不会跳动 */
export default function DeptLoading() {
  return (
    <>
      <PageHeader title="部门管理" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="h-80 animate-pulse rounded-xl bg-muted" />
        <div className="h-80 animate-pulse rounded-xl bg-muted lg:col-span-3" />
      </div>
    </>
  );
}
