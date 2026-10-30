"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/common/pagination";
import { SearchBar } from "@/components/common/search-bar";
import {
  createDeptAction,
  updateDeptAction,
} from "@/server/dept/actions";
import { getExcludedDeptIds } from "@/server/dept/tree";
import type {
  PageData,
  Row,
  TreeNode,
} from "@/server/dept/types";
import { DeleteDeptDialog } from "./delete-dialog";
import {
  DeptEditDialog,
  emptyForm,
  toDeptInput,
  toForm,
  type DeptForm,
} from "./dept-edit-dialog";
import { DeptTable } from "./dept-table";
import { TreeNodeItem } from "./tree-node-item";

/** 弹窗的两种状态：关闭 / 新增 / 编辑 */
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
  const pathname = usePathname();
  // isPending：跳转期间为 true，用来给表格一个“加载中”的视觉反馈
  const [isPending, startTransition] = useTransition();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

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

    startTransition(() => {
      router.push(sp.size ? `${pathname}?${sp}` : pathname);
    });
  }

  /** 提交表单：返回错误文案，成功时关闭弹窗并返回 undefined */
  async function save(form: DeptForm): Promise<string | undefined> {
    if (!dialog) return;

    const payload = toDeptInput(form);

    // Action 把业务失败放在返回值里，不能只依赖 catch
    const result =
      dialog.mode === "create"
        ? await createDeptAction(payload)
        : await updateDeptAction(dialog.deptId, payload);

    if (!result.ok) return result.message;

    // Action 内部已 revalidatePath("/dept")，当前页面会随之更新
    setDialog(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* 左：组织树 */}
      <Card>
        <CardHeader>
          <CardTitle>组织架构</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[70vh] space-y-0.5 overflow-y-auto">
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
        </CardContent>
      </Card>

      {/* 右：搜索 + 表格 + 分页 */}
      <div className={cn("space-y-3 lg:col-span-3", isPending && "opacity-60")}>
        <div className="flex items-start justify-between gap-3">
          {/* key={keyword}：URL 里的关键字变了（比如点浏览器后退），输入框随之重建 */}
          <SearchBar
            key={keyword}
            defaultValue={keyword}
            placeholder="搜索部门名称 / 编码"
            onSearch={(kw) => go({ keyword: kw })}
          />
          <Button
            onClick={() =>
              setDialog({ mode: "create", initial: emptyForm(selectedId) })
            }
          >
            新增部门
          </Button>
        </div>

        <DeptTable
          rows={pageData.rows}
          emptyText={
            selectedId ? "该部门下暂无子部门" : "没有符合条件的部门"
          }
          onEdit={(row) =>
            setDialog({
              mode: "edit",
              deptId: row.id,
              initial: toForm(row),
            })
          }
          onDelete={setDeleteTarget}
        />

        <Pagination
          page={pageData.page}
          total={pageData.total}
          pageSize={pageData.pageSize}
          onChange={(page) => go({ page })}
        />
      </div>

      {dialog && (
        <DeptEditDialog
          // key：新增 / 编辑不同部门时重建表单，避免上一次的状态残留
          key={dialog.mode === "create" ? "create" : dialog.deptId}
          mode={dialog.mode}
          initial={dialog.initial}
          tree={tree}
          excludeIds={
            dialog.mode === "edit"
              ? getExcludedDeptIds(tree, dialog.deptId)
              : []
          }
          onClose={() => setDialog(null)}
          onSubmit={save}
        />
      )}

      {/*
        deleteTarget 为 null 时整体卸载，而不是把 open 置为 false。

        Base UI 的弹窗在关闭时要等退出动画结束才卸载。删除成功后会立刻刷新页面，
        这次重渲染会打断退出动画，导致弹窗卡在“已关闭但没卸载”的状态。
        交给 React 直接卸载可以绕开对动画生命周期的依赖。
      */}
      {deleteTarget && (
        <DeleteDeptDialog
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            // 删除了当前选中的部门时，清掉 URL 里的 parent 筛选
            if (deleteTarget.id === selectedId) go({ parent: null });
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
