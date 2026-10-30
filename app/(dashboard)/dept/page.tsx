import { PageHeader } from "@/components/common/page-header";
import { buildTree } from "@/server/dept/tree";
import { toRow } from "@/server/dept/mappers";
import { DeptQuerySchema } from "@/server/dept/schema";
import { listDeptPage, listDepts } from "@/server/dept/service";
import { DeptWorkspace } from "./_components/workspace";

export default async function DeptPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 这一版 Next.js 里 searchParams 是异步的，必须先 await；
  // 同时用 Zod 兜底：重复参数会变成数组，直接调字符串方法会抛错
  const params = DeptQuerySchema.parse(await searchParams);

  // 两个查询互不依赖，可以并行
  const [allRows, data] = await Promise.all([
    listDepts(), // 全量数据：给组织树和“上级部门名称”用
    listDeptPage({
      keyword: params.keyword,
      parentId: params.parent,
      page: params.page,
      pageSize: 10,
    }),
  ]);

  // 上级部门名称：用已经取到的全量数据做映射，不用再查一次库
  const nameById = new Map(allRows.map((row) => [row.id, row.name]));

  return (
    <>
      <PageHeader title="部门管理" />

      <DeptWorkspace
        tree={buildTree(allRows)}
        pageData={{
          rows: data.rows.map((row) => toRow(row, nameById)),
          total: data.total,
          page: data.page,
          pageSize: data.pageSize,
        }}
        keyword={params.keyword}
        selectedId={params.parent ?? null}
      />
    </>
  );
}
