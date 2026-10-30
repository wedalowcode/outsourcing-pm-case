import type { DeptRecord, Row } from "./types";

/** 数据库记录的最小形状：mapper 只关心这些字段 */
type DeptDetail = DeptRecord & {
  sort: number;
  description: string | null;
};

/** 数据库记录 → 表格行：补上“上级部门名称” */
export function toRow(row: DeptDetail, nameById: Map<string, string>): Row {
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