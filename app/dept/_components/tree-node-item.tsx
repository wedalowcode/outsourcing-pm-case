"use client";

import { useState } from "react";
import type { TreeNode } from "@/server/dept/types";

type TreeNodeItemProps = {
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function TreeNodeItem({
  node,
  depth,
  selectedId,
  onSelect,
}: TreeNodeItemProps) {
  // 节点级状态：管理自身节点的展开/收起
  const [expanded, setExpanded] = useState<boolean>(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      {/* 节点单行容器 */}
      <div
        className={`flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors ${
          isSelected
            ? "bg-blue-600 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        style={{
          // 根据层级 depth 动态计算缩进距离
          paddingLeft: 8 + depth * 16,
        }}
      >
        {/* 展开/收起切换按钮 */}
        {hasChildren ? (
          <button
            type="button"
            className="w-4 text-center text-xs opacity-70 hover:opacity-100"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* 部门名称与选中点击 */}
        <button
          type="button"
          className="flex-1 truncate text-left"
          onClick={() => onSelect(node.id)}
        >
          {node.name}
        </button>
      </div>

      {/* 递归渲染子节点：仅当展开且存在子节点时渲染 */}
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNodeItem
            key={child.id}
            node={child}
            depth={depth + 1} // 深度递增，实现视觉缩进
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}