import type { Row, TreeNode } from "./types";

/** 数据库记录的最小形状：mapper 只关心这些字段 */
export type DeptRecord = {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  sort: number;
  status: number;
  description: string | null;
};

/** 扁平数组 → 树（与上一课逻辑一致，只是换了位置） */
export function buildTree(
  rows: DeptRecord[],
  parentId: string | null = null
): TreeNode[] {
  return rows
    .filter((row) => row.parentId === parentId)
    .map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      parentId: row.parentId,
      status: row.status,
      children: buildTree(rows, row.id),
    }));
}

/** 数据库记录 → 表格行：补上“上级部门名称” */
export function toRow(row: DeptRecord, nameById: Map<string, string>): Row {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    parentId: row.parentId,
    parentName: row.parentId ? (nameById.get(row.parentId) ?? null) : null,
    sort: row.sort,
    status: row.status,
    description: row.description,
  };
}