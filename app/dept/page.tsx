import { listDepts } from "@/server/dept/service";
import { buildTree } from "@/server/dept/tree";
import { DeptWorkspace } from "./dept-workspace";

// 每次请求都重新查库，避免构建时被静态预渲染成固定快照
export const dynamic = "force-dynamic";

export default async function DeptPage() {
  // 从数据库读取扁平数据，再组装成树
  const rows = await listDepts();
  const tree = buildTree(rows);

  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-800">
        部门管理
      </h1>

      {/* 将准备好的树形数据打入 Workspace 交互容器 */}
      <DeptWorkspace tree={tree} />
    </main>
  );
}