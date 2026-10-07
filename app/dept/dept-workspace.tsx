"use client";

import { useState } from "react";
import type { TreeNode } from "@/server/dept/types";
import { TreeNodeItem } from "./_components/tree-node-item";

export function DeptWorkspace({ tree }: { tree: TreeNode[] }) {
  // 页面级状态：管理当前选中的部门 ID
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-64 rounded-md border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-2 text-sm font-medium text-gray-700">
        组织架构
      </div>

      <div className="max-h-[70vh] space-y-0.5 overflow-y-auto">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ))}
      </div>
    </div>
  );
}