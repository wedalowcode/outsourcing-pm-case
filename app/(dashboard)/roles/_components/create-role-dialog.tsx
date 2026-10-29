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
import { Textarea } from "@/components/ui/textarea";

import { createRoleAction } from "@/server/role/actions";

type Props = {
  onCreated?: () => void;
};

const initialForm = {
  code: "",
  name: "",
  description: "",
  status: "ACTIVE" as "ACTIVE" | "DISABLED",
};

/** 状态下拉选项：value 用内部枚举，label 用中文，按钮上显示中文 */
const statusItems = [
  { value: "ACTIVE", label: "启用" },
  { value: "DISABLED", label: "停用" },
];

export function CreateRoleDialog({ onCreated }: Props) {
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

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await createRoleAction(form);

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
        新增角色
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
              <DialogTitle>新增角色</DialogTitle>
              <DialogDescription>
                创建角色基础资料，权限可以在后续步骤中配置。
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-code">角色编码 *</Label>
                <Input
                  id="role-code"
                  autoComplete="off"
                  value={form.code}
                  onChange={(event) =>
                    updateField("code", event.target.value)
                  }
                  placeholder="例如：PROJECT_MANAGER"
                  aria-invalid={Boolean(errorFor("code"))}
                  required
                  disabled={pending}
                />
                <p className="text-xs text-muted-foreground">
                  以字母开头，只能包含字母、数字、下划线和连字符。
                  保存时会统一转换为大写。
                </p>
                {errorFor("code") && (
                  <p className="text-sm text-destructive">
                    {errorFor("code")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-name">角色名称 *</Label>
                <Input
                  id="role-name"
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  placeholder="例如：项目经理"
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

              <div className="space-y-2">
                <Label htmlFor="role-description">
                  角色描述
                </Label>
                <Textarea
                  id="role-description"
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="描述该角色的业务职责和使用场景"
                  maxLength={500}
                  disabled={pending}
                  aria-invalid={Boolean(errorFor("description"))}
                  className="min-h-24"
                />
                {errorFor("description") && (
                  <p className="text-sm text-destructive">
                    {errorFor("description")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-status">角色状态</Label>
                <Select
                  items={statusItems}
                  value={form.status}
                  onValueChange={(value) =>
                    updateField(
                      "status",
                      value === "DISABLED"
                        ? "DISABLED"
                        : "ACTIVE",
                    )
                  }
                  disabled={pending}
                >
                  <SelectTrigger
                    id="role-status"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusItems.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                      >
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
                  {pending ? "正在创建..." : "创建角色"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
