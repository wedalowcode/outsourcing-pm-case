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

/**
 * 收集某个部门及其全部下级的 id。
 *
 * 编辑部门时用来排除非法的上级选项：不能把自己或自己的下级选为上级。
 */
export function getExcludedDeptIds(
  tree: TreeNode[],
  id: string
): string[] {
  function find(nodes: TreeNode[]): TreeNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;

      const hit = find(node.children);
      if (hit) return hit;
    }

    return null;
  }

  function collect(node: TreeNode): string[] {
    return [node.id, ...node.children.flatMap(collect)];
  }

  const target = find(tree);

  return target ? collect(target) : [];
}