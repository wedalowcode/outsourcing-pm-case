"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { deleteUserAction } from "@/server/user/actions";

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

type DeleteUserDialogProps = {
  user: {
    id: string;
    username: string;
    name: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: DeleteUserDialogProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      const result = await deleteUserAction({
        id: user.id,
      });

      if (!result.success) {
        setError(result.message ?? "删除失败");
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch {
      setError("请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  // Base UI 弹窗用条件渲染控制开关，避免关闭动画被打断后卡死
  if (!open) return null;

  return (
    <AlertDialog
      open
      onOpenChange={(nextOpen) => {
        if (!loading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            确认删除用户？
          </AlertDialogTitle>

          <AlertDialogDescription>
            即将删除用户「{user.name}」
            （{user.username}）。
            如果该用户关联了历史业务数据，
            系统将拒绝物理删除。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            取消
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
            disabled={loading}
          >
            {loading ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
