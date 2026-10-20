"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  createDeptAction,
  updateDeptAction,
} from "@/server/dept/actions";
import { getExcludedDeptIds } from "@/server/dept/tree";
import type {
  DeptInput,
  PageData,
  Row,
  TreeNode,
} from "@/server/dept/types";
import {
  DeptEditDialog,
  emptyForm,
  type DeptForm,
} from "./_components/dept-edit-dialog";
import { DeptTable } from "./_components/dept-table";
import { Pagination } from "./_components/pagination";
import { SearchBar } from "./_components/search-bar";
import { TreeNodeItem } from "./_components/tree-node-item";

/** 弹窗的三种状态：关闭 / 新增 / 编辑 */
type DialogState =
  | { mode: "create"; initial: DeptForm }
  | { mode: "edit"; initial: DeptForm; deptId: string }
  | null;

export function DeptWorkspace({
  tree,
  pageData,
  keyword,
  selectedId,
}: {
  tree: TreeNode[];
  pageData: PageData;
  keyword: string;
  selectedId: string | null;
}) {
  const router = useRouter();
  // isPending：跳转期间为 true，用来给表格一个“加载中”的视觉反馈
  const [isPending, startTransition] = useTransition();

  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function openCreateDialog() {
    setSubmitError("");
    // 选中某个部门时，默认把它作为上级
    setDialogState({
      mode: "create",
      initial: emptyForm(selectedId),
    });
  }

  function openEditDialog(row: Row) {
    setSubmitError("");
    setDialogState({
      mode: "edit",
      deptId: row.id,
      initial: {
        name: row.name,
        code: row.code,
        parentId: row.parentId,
        sort: String(row.sort),
        status: row.status === 1 ? 1 : 0,
        description: row.description ?? "",
      },
    });
  }

  async function handleSubmit(form: DeptForm) {
    if (!dialogState) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload: DeptInput = {
        name: form.name.trim(),
        parentId: form.parentId,
        sort: form.sort.trim() ? Number(form.sort) : undefined,
        status: form.status,
        description: form.description.trim(),
      };

      const result =
        dialogState.mode === "create"
          ? await createDeptAction(payload)
          : await updateDeptAction(dialogState.deptId, payload);

      // Action 把业务失败放在返回值里，不能只依赖 catch
      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }

      // 成功才关闭弹窗。Action 内部已经 revalidatePath("/dept")，
      // 这里再 refresh 一次，确保当前页面拿到最新数据。
      setDialogState(null);
      router.refresh();
    } catch (error) {
      console.error("保存部门失败", error);
      setSubmitError("保存失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * 统一的跳转入口：当前条件 + 本次改动 → 新的查询串
   * - keyword / parent：不传表示保持不变；keyword 传 ""、parent 传 null 表示清除
   * - page：不传就回到第 1 页。换搜索词、换部门都应该从头看；
   *         只有翻页时才显式传入目标页码
   */
  function go(next: { keyword?: string; parent?: string | null; page?: number }) {
    const kw = next.keyword ?? keyword;
    const pid = next.parent === undefined ? selectedId : next.parent;
    const p = next.page ?? 1;

    const sp = new URLSearchParams();
    if (kw) sp.set("keyword", kw);
    if (pid) sp.set("parent", pid);
    if (p > 1) sp.set("page", String(p));

    const url = sp.toString() ? `/dept?${sp.toString()}` : "/dept";
    startTransition(() => {
      router.push(url);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* 左：组织树 */}
      <div className="rounded-md border border-gray-200 p-3">
        <div className="mb-2 text-sm font-medium text-gray-700">组织架构</div>
        <div className="max-h-[70vh] space-y-0.5 overflow-y-auto">
          {tree.map((node) => (
            <TreeNodeItem
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedId}
              // 再点一次已选中的节点 = 取消选择
              onSelect={(id) => go({ parent: id === selectedId ? null : id })}
            />
          ))}
        </div>
      </div>

      {/* 右：搜索 + 表格 + 分页 */}
      <div className={`lg:col-span-3 ${isPending ? "opacity-60" : ""}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          {/* key={keyword}：URL 里的关键字变了（比如点浏览器后退），输入框随之重建 */}
          <SearchBar
            key={keyword}
            defaultValue={keyword}
            onSearch={(kw) => go({ keyword: kw })}
          />
          <Button onClick={openCreateDialog}>新增部门</Button>
        </div>
        <DeptTable
          rows={pageData.rows}
          filteredByParent={selectedId !== null}
          onEdit={openEditDialog}
        />
        <Pagination
          page={pageData.page}
          total={pageData.total}
          pageSize={pageData.pageSize}
          onChange={(p) => go({ page: p })}
        />
      </div>

      {dialogState && (
        <DeptEditDialog
          // key：新增 / 编辑不同部门时重建表单，避免上一次的状态残留
          key={
            dialogState.mode === "create"
              ? "create"
              : dialogState.deptId
          }
          mode={dialogState.mode}
          initial={dialogState.initial}
          tree={tree}
          excludeIds={
            dialogState.mode === "edit"
              ? getExcludedDeptIds(tree, dialogState.deptId)
              : []
          }
          error={submitError}
          submitting={submitting}
          onClose={() => {
            setDialogState(null);
            setSubmitError("");
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
