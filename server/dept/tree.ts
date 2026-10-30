import type { DeptRecord, TreeNode } from "./types";

/**
 * 扁平数组 → 树。
 *
 * 先用 Map 按 parentId 分组，再自顶向下递归，整体复杂度 O(n)。
 * 同级顺序沿用 listDepts 的 orderBy（sort asc, code asc），这里不再排序。
 */
export function buildTree(rows: DeptRecord[]): TreeNode[] {
  const childrenOf = new Map<string | null, DeptRecord[]>();

  for (const row of rows) {
    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row);
    childrenOf.set(row.parentId, list);
  }

  const build = (parentId: string | null): TreeNode[] =>
    (childrenOf.get(parentId) ?? []).map((row) => ({
      ...row,
      children: build(row.id),
    }));

  return build(null);
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