export type TreeNode = {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  status: number;
  children: TreeNode[]; // 递归嵌套结构
};