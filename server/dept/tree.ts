import type { listDepts } from "./service";
import type { TreeNode } from "./types";

// 算法核心：将扁平数组转换为 Tree 结构
export function buildTree(
  rows: Awaited<ReturnType<typeof listDepts>>,
  parentId: string | null = null
): TreeNode[] {
  return rows
    .filter((row) => row.parentId === parentId) // 步骤 A：找出当前层级的节点
    .map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      parentId: row.parentId,
      status: row.status,
      // 步骤 B：递归寻找当前节点的所有子节点
      children: buildTree(rows, row.id),
    }));
}