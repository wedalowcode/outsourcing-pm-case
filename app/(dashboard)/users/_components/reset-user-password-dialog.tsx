"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { resetUserPasswordAction } from "@/server/user/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ResetUserPasswordDialogProps = {
  user: {
    id: string;
    username: string;
    name: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 重置成功后由父组件展示成功提示 */
  onSuccess?: (message: string) => void;
};

export function ResetUserPasswordDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ResetUserPasswordDialogProps) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    if (loading) return;

    onOpenChange(nextOpen);

    if (!nextOpen) {
      setPassword("");
      setConfirmPassword("");
      setError("");
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (password.length < 12 || password.length > 128) {
      setError("密码长度必须为 12–128 个字符");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const result = await resetUserPasswordAction({
        id: user.id,
        password,
      });

      if (!result.success) {
        setError(result.message ?? "重置密码失败");
        return;
      }

      onSuccess?.(result.message || "密码重置成功");
      handleOpenChange(false);
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
    <Dialog
      open
      onOpenChange={handleOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重置用户密码</DialogTitle>

          <DialogDescription>
            为用户「{user.name}」
            （{user.username}）设置新密码。
            重置成功后，该用户需要重新登录。
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="reset-password">
              新密码
            </Label>

            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              minLength={12}
              maxLength={128}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              确认新密码
            </Label>

            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              minLength={12}
              maxLength={128}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "提交中..." : "确认重置"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
