"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteDeptAction } from "@/server/dept/actions";
import type { Row } from "@/server/dept/types";

/**
 * 删除确认弹窗：自行管理删除中状态与错误。
 *
 * 由父组件条件渲染（target 存在时才挂载），删除成功后由 onDeleted 通知父组件卸载。
 */
export function DeleteDeptDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: Row;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (deleting) return;

    setDeleting(true);
    setError("");

    const result = await deleteDeptAction(target.id).catch(() => null);

    setDeleting(false);

    if (!result?.ok) {
      setError(result?.message ?? "删除失败，请稍后重试");
      return;
    }

    onDeleted();
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !deleting) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除部门？</AlertDialogTitle>

          <AlertDialogDescription>
            将删除部门“{target.name}”，删除后无法恢复。存在下级部门时不能删除。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>

          <AlertDialogAction
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {deleting ? "删除中…" : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
