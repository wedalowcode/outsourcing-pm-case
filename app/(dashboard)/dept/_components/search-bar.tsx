"use client";

import { useState } from "react";

export function SearchBar({
  defaultValue,
  onSearch,
}: {
  defaultValue: string;
  onSearch: (keyword: string) => void;
}) {
  // 输入框的草稿值：只有点“查询”或按回车时才上报，不会每敲一个字就查库
  const [draft, setDraft] = useState(defaultValue);

  return (
    <div className="flex gap-2">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch(draft.trim());
        }}
        className="h-9 w-64 rounded-md border border-gray-300 px-3 text-sm"
        placeholder="搜索部门名称 / 编码"
      />
      <button
        type="button"
        onClick={() => onSearch(draft.trim())}
        className="rounded-md border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
      >
        查询
      </button>
    </div>
  );
}