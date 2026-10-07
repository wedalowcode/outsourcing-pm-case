import { db } from "@/lib/db";

export default async function Page() {
  // 临时插入一条数据，验证完成后记得删除这一整段
  /*const dept = await db.dept.create({
    data: {
      name: "技术部",
      code: "TECH",
      sort: 1,
      status: 1,
      description: "负责公司技术研发工作",
    },
  });*/

  const depts = await db.dept.findMany();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        部门列表
      </h1>

      <pre className="mt-6">
        {JSON.stringify(depts, null, 2)}
      </pre>
    </main>
  );
}