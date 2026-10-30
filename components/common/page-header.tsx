import type { ReactNode } from "react";

/** 页面标题：page / loading / error 共用，保证三者布局一致 */
export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}
