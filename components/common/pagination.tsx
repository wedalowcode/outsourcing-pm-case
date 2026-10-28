"use client";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
};

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: PaginationProps) {
  const pageCount = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        共 {total} 条 · 第 {page}/{pageCount} 页
      </span>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          上一页
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
