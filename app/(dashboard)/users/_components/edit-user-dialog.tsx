"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { updateUserAction } from "@/server/user/actions";

export type EditableUser = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "DISABLED";
};

type Props = {
  user: EditableUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** 状态下拉选项：value 用内部枚举，label 用中文，按钮上显示中文 */
const statusItems = [
  { value: "ACTIVE", label: "启用" },
  { value: "DISABLED", label: "停用" },
];

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [status, setStatus] = useState<
    "ACTIVE" | "DISABLED"
  >(user.status);

  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});

  // 每次打开编辑窗口，都使用最新的用户资料初始化表单。
  useEffect(() => {
    if (!open) return;

    setName(user.name);
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setStatus(user.status);
    setMessage("");
    setFieldErrors({});
  }, [open, user]);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateUserAction({
        id: user.id,
        name,
        email,
        phone,
        status,
      });

      if (!result.success) {
        setMessage(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  function errorFor(field: string) {
    return fieldErrors[field]?.[0];
  }

  // Base UI 弹窗用条件渲染控制开关，避免关闭动画被打断后卡死
  if (!open) return null;

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!pending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>
            修改用户基本资料。用户名不可修改，密码需要通过独立的重置功能处理。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-username">用户名</Label>
            <Input
              id="edit-username"
              value={user.username}
              disabled
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">姓名 *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              aria-invalid={Boolean(errorFor("name"))}
              disabled={pending}
              required
            />
            {errorFor("name") && (
              <p className="text-sm text-destructive">
                {errorFor("name")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">邮箱</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              aria-invalid={Boolean(errorFor("email"))}
              disabled={pending}
            />
            {errorFor("email") && (
              <p className="text-sm text-destructive">
                {errorFor("email")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">手机号</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              aria-invalid={Boolean(errorFor("phone"))}
              disabled={pending}
            />
            {errorFor("phone") && (
              <p className="text-sm text-destructive">
                {errorFor("phone")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>用户状态</Label>

            <Select
              items={statusItems}
              value={status}
              onValueChange={(value) => {
                if (
                  value === "ACTIVE" ||
                  value === "DISABLED"
                ) {
                  setStatus(value);
                }
              }}
              disabled={pending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择用户状态" />
              </SelectTrigger>

              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {message && (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>

            <Button type="submit" disabled={pending}>
              {pending ? "正在保存..." : "保存修改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
