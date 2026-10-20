import { buildTree, toRow } from "@/server/dept/mappers";
import { listDeptPage, listDepts } from "@/server/dept/service";
import { DeptWorkspace } from "./dept-workspace";

export default async function DeptPage({
  searchParams,
}: {
  searchParams: Promise<{
    keyword?: string;
    parent?: string;
    page?: string;
  }>;
}) {
  // 这一版 Next.js 里 searchParams 是异步的，必须先 await
  const params = await searchParams;
  const page = Number(params.page) || 1; // URL 上的值都是字符串，要自己转数字

  // 两个查询互不依赖，可以并行
  const [allRows, data] = await Promise.all([
    listDepts(), // 全量数据：给组织树和“上级部门名称”用
    listDeptPage({
      keyword: params.keyword,
      parentId: params.parent,
      page,
      pageSize: 10,
    }),
  ]);

  const tree = buildTree(allRows);

  // 上级部门名称：用已经取到的全量数据做映射，不用再查一次库
  const nameById = new Map(allRows.map((row) => [row.id, row.name]));

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold text-gray-800">部门管理</h1>

      <DeptWorkspace
        tree={tree}
        pageData={{
          rows: data.rows.map((row) => toRow(row, nameById)),
          total: data.total,
          page: data.page,
          pageSize: data.pageSize,
        }}
        keyword={params.keyword ?? ""}
        selectedId={params.parent ?? null}
      />
    </>
  );
}