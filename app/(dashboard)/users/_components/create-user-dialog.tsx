"use client";

import { useState, useTransition } from "react";
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

import { createUserAction } from "@/server/user/actions";

type Props = {
  onCreated?: () => void;
};

const initialForm = {
  username: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  status: "ACTIVE" as "ACTIVE" | "DISABLED",
};

/** 状态下拉选项：value 用内部枚举，label 用中文，按钮上显示中文 */
const statusItems = [
  { value: "ACTIVE", label: "启用" },
  { value: "DISABLED", label: "停用" },
];

export function CreateUserDialog({ onCreated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});

  function updateField(
    field: keyof typeof initialForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setMessage("");
  }

  function closeDialog() {
    if (pending) return;

    setOpen(false);
    setForm(initialForm);
    setMessage("");
    setFieldErrors({});
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await createUserAction(form);

      if (!result.success) {
        setMessage(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setOpen(false);
      setForm(initialForm);
      setMessage("");
      setFieldErrors({});

      router.refresh();
      onCreated?.();
    });
  }

  function errorFor(field: string) {
    return fieldErrors[field]?.[0];
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        新增用户
      </Button>

      {/* Base UI 弹窗用条件渲染控制开关，避免关闭动画被打断后卡死 */}
      {open && (
        <Dialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closeDialog();
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>新增用户</DialogTitle>
              <DialogDescription>
                填写账号信息并设置初始密码。
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名 *</Label>
                <Input
                  id="username"
                  autoComplete="off"
                  value={form.username}
                  onChange={(event) =>
                    updateField("username", event.target.value)
                  }
                  aria-invalid={Boolean(errorFor("username"))}
                  required
                  disabled={pending}
                />
                {errorFor("username") && (
                  <p className="text-sm text-destructive">
                    {errorFor("username")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  aria-invalid={Boolean(errorFor("name"))}
                  required
                  disabled={pending}
                />
                {errorFor("name") && (
                  <p className="text-sm text-destructive">
                    {errorFor("name")}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
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
                  <Label htmlFor="phone">手机号</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">初始密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  aria-invalid={Boolean(errorFor("password"))}
                  required
                  disabled={pending}
                />
                <p className="text-xs text-muted-foreground">
                  至少 12 个字符，避免使用常见弱密码。
                </p>
                {errorFor("password") && (
                  <p className="text-sm text-destructive">
                    {errorFor("password")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码 *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  aria-invalid={Boolean(errorFor("confirmPassword"))}
                  required
                  disabled={pending}
                />
                {errorFor("confirmPassword") && (
                  <p className="text-sm text-destructive">
                    {errorFor("confirmPassword")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">用户状态</Label>
                <Select
                  items={statusItems}
                  value={form.status}
                  onValueChange={(value) =>
                    updateField(
                      "status",
                      value === "DISABLED" ? "DISABLED" : "ACTIVE",
                    )
                  }
                  disabled={pending}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
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
                  onClick={closeDialog}
                  disabled={pending}
                >
                  取消
                </Button>

                <Button type="submit" disabled={pending}>
                  {pending ? "正在创建..." : "创建用户"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
