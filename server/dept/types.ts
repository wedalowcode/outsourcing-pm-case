/** 部门状态常量：0 停用，1 启用（与 schema.ts 的 DeptStatusSchema 对应） */
export const DEPT_STATUS = {
  DISABLED: 0,
  ENABLED: 1,
} as const;

export type TreeNode = {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  status: number;
  children: TreeNode[];
};

/** 表格行：给表格用，扁平，多了 parentName 和 sort */
export type Row = {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  parentName: string | null; // 上级部门名称：表格要显示的是名字，不是 id
  sort: number;
  status: number;
  description: string | null; // 编辑弹窗要回填这个字段
};

/** 一页数据 + 分页信息 */
export type PageData = {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
};

// 部门输入的类型与运行时校验规则统一由 schema.ts 维护，
// 这里只做转发，避免两处定义逐渐发生偏差。
export type {
  DeptInput,
  DeptStatus,
} from "@/server/dept/schema";