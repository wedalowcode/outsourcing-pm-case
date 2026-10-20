import { DEPT_STATUS, type Row } from "@/server/dept/types";

export function DeptTable({
  rows,
  filteredByParent,
  onEdit,
  onDelete,
}: {
  rows: Row[];
  filteredByParent: boolean; // 是否选中了某个上级部门，用来区分两种空状态
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
          <th className="py-2 font-medium">编码</th>
          <th className="py-2 font-medium">部门名称</th>
          <th className="py-2 font-medium">上级部门</th>
          <th className="py-2 font-medium">排序</th>
          <th className="py-2 font-medium">状态</th>
          <th className="py-2 font-medium">操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-10 text-center text-gray-400">
              {filteredByParent ? "该部门下暂无子部门" : "没有符合条件的部门"}
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const enabled = row.status === DEPT_STATUS.ENABLED;
            return (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 font-mono text-xs text-gray-600">{row.code}</td>
                <td className="py-2 text-gray-800">{row.name}</td>
                <td className="py-2 text-gray-600">{row.parentName ?? "—"}</td>
                <td className="py-2 text-gray-600">{row.sort}</td>
                <td className={`py-2 ${enabled ? "text-green-600" : "text-gray-400"}`}>
                  {enabled ? "启用" : "停用"}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => onEdit(row)}
                    >
                      编辑
                    </button>

                    <button
                      type="button"
                      className="text-destructive hover:underline"
                      onClick={() => onDelete(row)}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}